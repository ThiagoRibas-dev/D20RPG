import { ItemInstance } from "./components/itemInstance.mjs";
import { ContentItem } from "./entities/contentItem.mjs";
import { Entity, EntityClass } from "./entities/entity.mjs";
import { ModifierManager } from "./modifierManager.mjs";
import { MapTile } from "./entities/mapTile.mjs";
import { ModifierList } from "./entities/modifier.mjs";
import { ActiveEffect } from "./activeEffect.mjs";
import { Action } from "./actions/action.mjs";
import { MoveAction } from "./actions/moveAction.mjs";
import { UsePowerAction } from "./actions/usePowerAction.mjs";
import { GameEvents } from "./events.mjs";
import { globalServiceLocator } from "./serviceLocator.mjs";
import { calculateModifier, EntityPosition, getRandomInt, rollD20 } from "./utils.mjs";

/**
 * The RulesEngine is the central authority for all game rule calculations.
 * It processes stats, validates actions, and resolves combat events.
 */
export class RulesEngine {
    constructor() {
        globalServiceLocator.eventBus.subscribe(GameEvents.ACTION_ATTACK_DECLARED,
            (event) => this.resolveAttack(event.data)
        );
        globalServiceLocator.eventBus.subscribe(GameEvents.ACTION_MOVE_DECLARED,
            (event) => this.resolveMove(event.data)
        );
        globalServiceLocator.eventBus.subscribe(GameEvents.ACTION_USE_POWER_DECLARED,
            (event) => this.resolvePowerUse(event.data)
        );
        globalServiceLocator.eventBus.subscribe(GameEvents.CHARACTER_TAKES_DAMAGE,
            (event) => this.resolveConcentrationCheck(event.data)
        );
    }

    /**
    * Manages the entire resolution of a single attack, from roll to outcome.
    * This is the heart of the combat event chain.
    */
    private resolveAttack(data: { attacker: Entity, target: Entity, weapon: ContentItem, continuationAction?: Action }): void {
        const { attacker, target, weapon, continuationAction } = data;
        console.log(`--- Resolving attack from ${attacker.name} to ${target.name} ---`);

        if (!continuationAction && weapon.tags.includes('ranged')) {
            const attackAction = new (Action as any)(attacker, weapon, target);
            if (this.checkForAoO(attackAction, 'ranged')) {
                return;
            }
        }

        // If we aren't in combat and this is a hostile action, start combat.
        if (!globalServiceLocator.turnManager.isCombatActive) {
            // In the future check faction alignment etc. For now, any attack starts combat.
            console.log("Hostile action taken outside of combat. Initiating combat!");
            globalServiceLocator.turnManager.startCombat([attacker, target]);
            // We let the attack resolve
        }

        const baseAttackBonuses = this.getAttackBonuses(attacker.baseAttackBonus);

        for (const base of baseAttackBonuses) {
            // 1. CREATE CONTEXT
            // This object will hold all data for this single attack.
            const attackContext = {
                attacker,
                target,
                weapon,
                attackRoll: {
                    d20: 0,
                    base: base,
                    abilityMod: calculateModifier(attacker.getAbilityScore('str')), // Assuming melee for now
                    misc: new ModifierList(globalServiceLocator.modifierManager.modifierTypes), // For Power Attack, Bless, etc.
                    final: 0,
                },
                outcome: 'pending' as 'pending' | 'miss' | 'hit' | 'critical_threat' | 'critical_hit',
            };

            // 2. FIRE "BEFORE_ROLL" EVENT
            // This gives other systems (feats, spells) a chance to modify the attack.
            globalServiceLocator.eventBus.publish(GameEvents.ACTION_ATTACK_BEFORE_ROLL, attackContext);

            // 3. ROLL THE DIE
            attackContext.attackRoll.d20 = rollD20(); // From utils.mts

            // 4. CALCULATE FINAL ATTACK ROLL
            attackContext.attackRoll.final =
                attackContext.attackRoll.d20 +
                attackContext.attackRoll.base +
                attackContext.attackRoll.abilityMod +
                attackContext.attackRoll.misc.getTotal(); // Get total from all stacking bonuses/penalties

            // 5. COMPARE TO TARGET'S AC
            const targetAC = target.getArmorClass();

            // 6. DETERMINE OUTCOME
            if (attackContext.attackRoll.d20 === 1) {
                attackContext.outcome = 'miss'; // Natural 1 is always a miss
            } else if (attackContext.attackRoll.d20 === 20) {
                attackContext.outcome = 'critical_threat'; // Natural 20 is always a threat
            } else if (attackContext.attackRoll.final >= targetAC) {
                attackContext.outcome = 'hit';
            } else {
                attackContext.outcome = 'miss';
            }

            if (attackContext.outcome === 'hit' || attackContext.outcome === 'critical_threat') {
                const damageContext = {
                    attacker: attacker,
                    target: target,
                    weapon: weapon,
                    damageRoll: {
                        dice: weapon.damage || '1d4', // e.g., "2d4" from falchion.json
                        bonus: 0, // For STR mod, Power Attack, etc.
                        total: 0
                    },
                    damageType: weapon.damage_type || 'bludgeoning',
                    isCritical: false
                };

                // --- HANDLE CRITICAL THREAT ---
                if (attackContext.outcome === 'critical_threat') {
                    console.log("Critical Threat! Rolling for confirmation...");
                    // Make a second attack roll (the confirmation roll)
                    const confirmationRoll = rollD20() + attackContext.attackRoll.base + attackContext.attackRoll.abilityMod + attackContext.attackRoll.misc.getTotal();

                    if (confirmationRoll >= targetAC) {
                        console.log(`Confirmation Succeeded! (Roll: ${confirmationRoll})`);
                        attackContext.outcome = 'critical_hit'; // Officially a crit
                        damageContext.isCritical = true;
                    } else {
                        console.log(`Confirmation Failed. (Roll: ${confirmationRoll}) Treating as a normal hit.`);
                        attackContext.outcome = 'hit'; // Downgrade to a normal hit
                    }
                }

                // This is the hook for PowerAttackEffectLogic.modifyDamage
                globalServiceLocator.eventBus.publish(GameEvents.ACTION_DAMAGE_BEFORE_ROLL, damageContext);

                // Resolve the damage
                this.resolveDamage(damageContext);
            }

            console.log(`Attack Roll: ${attackContext.attackRoll.final} vs AC ${targetAC} -> ${attackContext.outcome.toUpperCase()}`);

            // 7. FIRE "RESOLVED" EVENT
            // Announce the final result of the attack roll.
            globalServiceLocator.eventBus.publish(GameEvents.ACTION_ATTACK_RESOLVED, attackContext);
        }
    }

    /**
     * Calculates all permanent stats and modifiers for an entity.
     * This is the "Permanent Layer" of the pipeline. It should be called
     * upon character finalization and level-up.
     */
    public calculateStats(entity: Entity): void {
        console.log(`Calculating stats for ${entity.name}...`);
        entity.modifiers = new ModifierManager(globalServiceLocator.contentLoader.modifierTypes);
        entity.proficiencies.clear();

        // --- 1. GATHER ALL EFFECTS ---
        const allEffects: any[] = [];
        const sources: { source: ContentItem, name: string }[] = [];

        if (entity.selectedRace) {
            sources.push({ source: entity.selectedRace, name: entity.selectedRace.name });
        }
        entity.feats.forEach(feat => sources.push({ source: feat, name: feat.name }));
        entity.classes.forEach(cls => {
            // Add effects from the class itself
            sources.push({ source: cls.class, name: cls.class.name });
            // Add effects from level progression
            for (let i = 0; i < cls.level; i++) {
                const levelData = cls.class.level_progression[i];
                levelData?.special?.forEach((ability: any) => {
                    // This is a bit of a hack; ideally, 'special' would be a ContentItem
                    allEffects.push({ ...ability, sourceName: cls.class.name });
                });
            }
        });

        sources.forEach(({ source, name }) => {
            source.effects?.forEach((effect: any) => {
                allEffects.push({ ...effect, sourceName: name });
            });
        });


        // --- 2. PROCESS ALL EFFECTS ---
        entity.featSlots = []; // Reset feat slots
        allEffects.forEach(effect => {
            switch (effect.type) {
                case 'add_feat_slot':
                    entity.featSlots.push({
                        source: effect.sourceName,
                        tags: effect.tags || [],
                        feat: null
                    });
                    break;
                case 'bonus':
                    entity.modifiers.add({
                        value: effect.value,
                        type: effect.bonus_type,
                        target: effect.target,
                        source: effect.sourceName,
                        sourceId: effect.sourceName // Simple source tracking for now
                    });
                    break;
                case 'proficiency':
                    if (effect.proficiencies) {
                        effect.proficiencies.forEach((prof: string) => entity.proficiencies.add(prof));
                    }
                    break;
                case 'script':
                    // Permanent scripts are applied here
                    globalServiceLocator.effectManager.applyScriptedEffect(effect, entity, entity);
                    break;
            }
        });

        // --- 3. CALCULATE BASE VALUES FROM CLASS ---
        let baseAttackBonus = 0;
        let baseFort = 0, baseRef = 0, baseWill = 0;
        entity.classes.forEach((cls: EntityClass) => {
            const classData = cls.class;
            const levelIndex = cls.level - 1;
            if (classData.level_progression && classData.level_progression[levelIndex]) {
                const levelData = classData.level_progression[levelIndex];
                baseAttackBonus += levelData.base_attack_bonus;
                baseFort += levelData.fortitude_save;
                baseRef += levelData.reflex_save;
                baseWill += levelData.will_save;
            }
        });
        entity.baseAttackBonus = baseAttackBonus;
        entity.modifiers.add({ value: baseFort, type: 'base', target: 'saves.fortitude', source: 'Class Level' });
        entity.modifiers.add({ value: baseRef, type: 'base', target: 'saves.reflex', source: 'Class Level' });
        entity.modifiers.add({ value: baseWill, type: 'base', target: 'saves.will', source: 'Class Level' });

        // --- 4. CALCULATE FINAL DERIVED STATS ---
        // Add ability score modifiers to saves
        // Note: We add these as permanent modifiers during the initial calculation.
        // The 'ability' type ensures they don't stack with themselves if recalculated.
        entity.modifiers.add({ value: calculateModifier(entity.baseStats.con), type: 'ability', target: 'saves.fortitude', source: 'Constitution' });
        entity.modifiers.add({ value: calculateModifier(entity.baseStats.dex), type: 'ability', target: 'saves.reflex', source: 'Dexterity' });
        entity.modifiers.add({ value: calculateModifier(entity.baseStats.wis), type: 'ability', target: 'saves.will', source: 'Wisdom' });

        // Calculate Final Hit Points
        let totalHP = 0;
        const conMod = calculateModifier(entity.getAbilityScore('con'));

        entity.classes.forEach(cls => {
            const hitDie = parseInt(cls.class.hit_die.replace('d', ''), 10);
            // First level is max HP
            totalHP += hitDie + conMod;
            // Subsequent levels are average + con mod
            if (cls.level > 1) {
                const avgHP = (hitDie / 2) + 1;
                totalHP += (Math.max(1, avgHP + conMod)) * (cls.level - 1);
            }
        });

        // Add HP bonuses from other sources like Feats (Toughness)
        totalHP += entity.modifiers.getValue('hit_points', 0, entity);

        entity.hitPoints.max = totalHP;
        entity.hitPoints.current = totalHP; // Fully heal on level up/creation

        // --- 5. CALCULATE SKILL POINTS ---
        let totalSkillPoints = 0;
        const intMod = calculateModifier(entity.getAbilityScore('int'));

        entity.classes.forEach(cls => {
            const classData = cls.class;
            const basePoints = classData.skill_points_per_level.base || 0;
            const isHuman = entity.selectedRace?.name === 'Human';

            // Level 1 calculation
            let firstLevelPoints = (basePoints + intMod) * 4;
            if (isHuman) {
                firstLevelPoints += 4; // Human bonus at 1st level
            }
            totalSkillPoints += Math.max(4, firstLevelPoints); // Minimum 4 points at 1st level

            // Subsequent levels
            if (cls.level > 1) {
                let perLevelPoints = basePoints + intMod;
                if (isHuman) {
                    perLevelPoints += 1; // Human bonus per level
                }
                totalSkillPoints += Math.max(1, perLevelPoints) * (cls.level - 1); // Minimum 1 point per level
            }
        });

        entity.skills.remaining = totalSkillPoints;

        // --- 6. CALCULATE FEAT SLOTS ---
        // Base feats from level progression
        entity.featSlots.push({ source: 'level_1', tags: [], feat: null });
        if (entity.totalLevel >= 3) entity.featSlots.push({ source: 'level_3', tags: [], feat: null });
        if (entity.totalLevel >= 6) entity.featSlots.push({ source: 'level_6', tags: [], feat: null });
        if (entity.totalLevel >= 9) entity.featSlots.push({ source: 'level_9', tags: [], feat: null });
        if (entity.totalLevel >= 12) entity.featSlots.push({ source: 'level_12', tags: [], feat: null });
        if (entity.totalLevel >= 15) entity.featSlots.push({ source: 'level_15', tags: [], feat: null });
        if (entity.totalLevel >= 18) entity.featSlots.push({ source: 'level_18', tags: [], feat: null });

        // Specific class bonuses (e.g., Fighter bonus feats)
        entity.classes.forEach(cls => {
            const classData = cls.class;
            for (let i = 0; i < cls.level; i++) {
                const levelData = classData.level_progression[i];
                if (levelData?.bonus_feat) {
                    entity.featSlots.push({
                        source: `${classData.id}_${i + 1}`,
                        tags: levelData.bonus_feat.tags || [],
                        feat: null
                    });
                }
            }
        });

        console.log(`${entity.name} stats calculated.`, {
            modifiers: entity.modifiers,
            proficiencies: [...entity.proficiencies],
            skillPoints: entity.skills.remaining,
            featSlots: entity.featSlots
        });

        globalServiceLocator.eventBus.publish(GameEvents.ENTITY_STATS_CALCULATED, { entity });
    }

    private resolveDamage(context: any): void {
        const { attacker, target, weapon, damageRoll, isCritical } = context;

        // 1. Add ability modifier to bonus
        const strMod = calculateModifier(attacker.getAbilityScore('str'));
        damageRoll.bonus += strMod;

        const [numDice, diceType] = damageRoll.dice.split('d').map(Number);
        let totalDiceResult = 0;

        // 2. Roll the dice (you'll need a utility to parse '2d4' etc.)
        // Determine number of times to roll damage dice
        const critMultiplier = isCritical ? (weapon.critical?.multiplier || 2) : 1;
        for (let i = 0; i < critMultiplier; i++) {
            for (let j = 0; j < numDice; j++) {
                totalDiceResult += getRandomInt(1, diceType);
            }
        }

        // Flat bonuses are added AFTER dice multiplication
        damageRoll.total = totalDiceResult + damageRoll.bonus;

        // 3. Announce damage for DR effects (future)
        globalServiceLocator.eventBus.publish(GameEvents.ACTION_DAMAGE_RESOLVED, context);

        // 4. Apply damage
        console.log(`${attacker.name} deals ${damageRoll.total} ${context.damageType} damage to ${target.name}.`);
        target.takeDamage(damageRoll.total, attacker);
        globalServiceLocator.eventBus.publish(GameEvents.CHARACTER_HP_CHANGED, { entity: target });

        if (!target.isAlive()) {
            globalServiceLocator.eventBus.publish(GameEvents.CHARACTER_DIED, { entity: target, killer: attacker });
        }
    }

    // Handle all move logic
    public resolveMove(data: { actor: Entity, direction: EntityPosition }): void {
        const { actor, direction } = data;
        if (!actor) {
            console.log("Actor is not initialized");
            return;
        }

        const moveAction = new MoveAction(actor, direction);
        if (this.checkForAoO(moveAction, 'move')) {
            return; // Stop execution, AoO is being handled.
        }

        // If no one threatens, complete the move immediately.
        this.executeMove(actor, direction);
    }

    public validateFeatPrerequisites(entity: Entity, feat: ContentItem): boolean {
        if (!feat.prerequisites) {
            return true; // No prerequisites, always valid.
        }

        for (const preq of feat.prerequisites) {
            if (preq.type === 'ability') {
                if (entity.getAbilityScore(preq.ability as keyof import("./entities/entity.mjs").EntityAbilityScores) < preq.value) {
                    return false;
                }
            } else if (preq.type === 'feat') {
                if (!entity.feats.some(f => f.id === preq.featId)) {
                    return false;
                }
            } else if (preq.type === 'bab') {
                if (entity.baseAttackBonus < preq.value) {
                    return false;
                }
            }
            // Add more prerequisite types here (e.g., class, level, skills)
        }

        return true;
    }

    public async resolveConcentrationCheck(data: { entity: Entity, amount: number, source: Entity | null }): Promise<void> {
        const { entity, amount } = data;
        if (entity.hasTag('casting')) {
            const dc = 10 + amount;
            const concentrationRoll = rollD20() + await entity.getSkillModifier('concentration');
            if (concentrationRoll < dc) {
                entity.tags.delete('casting');
                globalServiceLocator.feedback.addMessageToLog(`${entity.name} loses concentration!`, 'red');
            } else {
                globalServiceLocator.feedback.addMessageToLog(`${entity.name} maintains concentration.`, 'green');
            }
        }
    }

    public async resolvePowerUse(data: { actor: Entity, power: ContentItem, target: any, castOnDefensive?: boolean, isTouch?: boolean }): Promise<void> {
        const { actor, power, target, castOnDefensive, isTouch } = data;
        console.log(`${actor.name} is using power: ${power.name}`);

        actor.tags.add('casting');

        if (isTouch) {
            actor.tags.add('holding_the_charge');
            const effect: ActiveEffect = {
                id: 'effect-holding-the-charge',
                name: 'Holding the Charge',
                source: power.name,
                description: `You are holding the charge of ${power.name}.`,
                script: '',
                context: {
                    power: power,
                    target: target
                },
                tags: ['holding_the_charge'],
                sourceEffect: power,
                target: actor,
                durationInRounds: 1, // Lasts until discharged
                remainingRounds: 1,
                scriptInstance: null
            };
            actor.activeEffects.push(effect);
            globalServiceLocator.feedback.addMessageToLog(`${actor.name} is holding the charge of ${power.name}.`, 'yellow');
            return;
        }

        if (castOnDefensive) {
            const dc = 15 + (power.level * 2);
            const concentrationRoll = rollD20() + await actor.getSkillModifier('concentration');
            if (concentrationRoll < dc) {
                globalServiceLocator.feedback.addMessageToLog(`${actor.name} fails to cast defensively and loses the power!`, 'red');
                return;
            }
        } else {
            const powerAction = new UsePowerAction(actor, power, target);
            if (this.checkForAoO(powerAction, 'cast')) {
                return; // Stop execution, AoO is being handled.
            }
        }


        // In a real implementation, this would be much more complex,
        // handling different power types, targeting, saving throws, etc.
        // For now, we'll just log the event.
        if (power.trigger_effect) {
            globalServiceLocator.effectManager.triggerEffect(power.trigger_effect, actor, target);
        }

        actor.tags.delete('casting');
    }

    public executeMove(actor: Entity, direction: EntityPosition): void {
        const prevPlayerPosition = { ...actor.position };
        const currentPosition = actor.position;
        const intendedNewPosition = {
            x: currentPosition.x + direction.x,
            y: currentPosition.y + direction.y,
        };

        const map = globalServiceLocator.state.currentMapData;
        if (!map) {
            console.error('currentMapDataMap not loaded');
            return;
        }

        const tileDefs = globalServiceLocator.contentLoader.tileDefinitions;
        if (!tileDefs) {
            console.error('tileDefinitions definitions not loaded');
            return;
        }

        const mapTiles = map.tiles; // Get map tiles
        const mapHeight = mapTiles.length;
        const mapWidth = mapTiles[0].length;

        // --- Boundary Check ---
        const isValidMovement: boolean = intendedNewPosition.x >= 0
            && intendedNewPosition.x < mapWidth
            && intendedNewPosition.y >= 0
            && intendedNewPosition.y < mapHeight;
        if (!isValidMovement) {
            console.log("Movement blocked by map boundary");
            globalServiceLocator.eventBus.publish(GameEvents.ACTION_MOVE_BLOCKED, {
                actor: actor,
                reason: 'boundary',
                blocker: null // No specific object, just the edge of the world
            });
            return;
        }

        // --- Tile Definition and Cost Check ---
        const tileSymbol = map.tiles[intendedNewPosition.y][intendedNewPosition.x];
        const tileDef = tileDefs.find(def => def.symbol === tileSymbol);
        const moveCost = tileDef?.moveCost || 5; // Default cost is 5ft.

        if (actor.actionBudget.movementPoints < moveCost) {
            globalServiceLocator.feedback.addMessageToLog("You don't have enough movement left.", "yellow");
            return;
        }

        // --- Tile Collision Check ---
        if (tileDef?.isBlocking) {
            console.log(`Movement for ${actor.name} blocked by ${tileDef.name}.`);
            globalServiceLocator.eventBus.publish(GameEvents.ACTION_MOVE_BLOCKED, {
                actor: actor,
                reason: 'tile',
                blocker: tileDef // Pass the tile definition as the blocker
            });
            return;
        }

        // --- Entity Collision Check ---
        const blockingEntity = globalServiceLocator.renderer.findEntityAt(intendedNewPosition);
        if (blockingEntity) {
            console.log(`Movement for ${actor.name} blocked by ${blockingEntity.name}.`);
            globalServiceLocator.eventBus.publish(GameEvents.ACTION_MOVE_BLOCKED, {
                actor: actor,
                reason: 'entity',
                blocker: blockingEntity // Pass the entity as the blocker
            });
            return;
        }

        // --- Success! Deduct cost and update state. ---
        actor.actionBudget.movementPoints -= moveCost;
        actor.position = intendedNewPosition;

        globalServiceLocator.eventBus.publish(GameEvents.ENTITY_MOVED, {
            entity: actor,
            from: prevPlayerPosition,
            to: intendedNewPosition,
            cost: moveCost
        });


        if (tileDef && tileDef.isTrigger) {
            console.log("Stepped on a trigger tile!");

            const triggerSymbol = tileSymbol;
            const trigger = globalServiceLocator.state.currentMapData.triggers.find(
                (triggerDef: MapTile) => triggerDef.symbol === triggerSymbol
            );

            if (trigger) {
                const targetMapName = trigger.targetMap;
                const targetLocation = trigger.targetLocation;
                console.log('Hit trigger', targetMapName, targetLocation);

                const newMapData = globalServiceLocator.state.currentCampaignData?.maps[targetMapName].get();
                if (!newMapData) {
                    console.error("Failed to load target map:", targetMapName);
                }

                actor.position = targetLocation;
                globalServiceLocator.state.currentMapData = newMapData;
                globalServiceLocator.renderer.renderMapFull(newMapData);
                return; // Exit after map transition
            } else {
                console.error("Trigger definition not found for symbol:", triggerSymbol);
            }
        }

        globalServiceLocator.renderer.redrawTiles(prevPlayerPosition, intendedNewPosition);
        globalServiceLocator.renderer.renderSingleEntity(actor);
    }

    // Helper to parse threat range like "18-20"
    private parseThreatRange(rangeStr: string): number {
        if (rangeStr.includes('-')) {
            return parseInt(rangeStr.split('-')[0], 10);
        }
        return parseInt(rangeStr, 10);
    }

    private getAttackBonuses(bab: number): number[] {
        const bonuses: number[] = [bab];
        let currentBab = bab;
        while (currentBab > 5) {
            currentBab -= 5;
            bonuses.push(currentBab);
        }
        return bonuses;
    }

    public checkForAoO(provokingAction: Action, triggerType: string) {
        const { actor } = provokingAction;
        const threateningNpcs = globalServiceLocator.state.npcs.filter(npc =>
            npc.isAlive() &&
            npc.disposition === 'hostile' && // Or based on faction
            (Math.abs(npc.position.x - actor.position.x) <= 1 && Math.abs(npc.position.y - actor.position.y) <= 1) &&
            this.canMakeAoO(npc)
        );

        if (threateningNpcs.length > 0) {
            console.log(`${actor.name}'s action (${triggerType}) provokes an AoO from ${threateningNpcs.map(n => n.name).join(', ')}!`);
            globalServiceLocator.eventBus.publish(GameEvents.ACTION_PROVOKES_AOO, {
                provokingActor: actor,
                threateningActors: threateningNpcs,
                continuationAction: provokingAction,
                triggerType: triggerType
            });
            return true; // Indicates an AoO was provoked
        }
        return false; // No AoO provoked
    }

    private canMakeAoO(entity: Entity): boolean {
        if (entity.aoo_used_this_round >= entity.max_aoo_per_round) {
            return false;
        }
        // In the future, check for statuses like stunned, paralyzed, etc.
        // For now, we assume the entity can always make an AoO if they have one available.
        return true;
    }

    public async resolveSkillUse(actor: Entity, skillId: string, useId: string, target: ItemInstance | Entity) {
        const skillData = await globalServiceLocator.contentLoader.loadSkill(skillId);
        if (!skillData) {
            console.error(`Could not load skill data for ID: ${skillId}`);
            return;
        }

        const skillUseData = skillData.active_uses?.find((use: any) => use.use_id === useId);
        if (!skillUseData) {
            console.error(`Could not find skill use ${useId} in ${skillId}`);
            return;
        }

        // Target validation and name extraction
        let targetName: string;
        if (skillUseData.target_type === 'item') {
            if (!(target instanceof ItemInstance)) {
                console.error(`Skill use ${useId} requires an item target.`);
                return;
            }
            targetName = target.itemData.name;
        } else if (skillUseData.target_type === 'entity') {
            if (!(target instanceof Entity)) {
                console.error(`Skill use ${useId} requires an entity target.`);
                return;
            }
            targetName = target.name;
        } else {
            targetName = "an unknown target";
        }


        // Calculate DC
        let dc = skillUseData.dc.base || 0;
        if (skillUseData.dc.add === 'target_caster_level' && target instanceof ItemInstance) {
            dc += target.itemData.caster_level || 0;
        }

        // Roll skill check
        const skillRoll = rollD20() + await actor.getSkillModifier(skillId);

        console.log(`${actor.name} attempts to ${skillUseData.name} on ${targetName}. Roll: ${skillRoll} vs DC: ${dc}`);

        if (skillRoll >= dc) {
            console.log("Skill check successful!");
            globalServiceLocator.feedback.addMessageToLog(`${actor.name} successfully uses ${skillData.name} on ${targetName}.`, 'green');

            // Handle the specific "identify_item" case
            if (useId === 'identify_item' && target instanceof ItemInstance) {
                const unidentifiedIndex = target.itemData.tags.indexOf('state:unidentified');
                if (unidentifiedIndex > -1) {
                    target.itemData.tags.splice(unidentifiedIndex, 1);
                    target.itemData.tags.push('state:identified');
                    console.log(`Item ${target.itemData.name} identified!`);
                    globalServiceLocator.feedback.addMessageToLog(`You have identified the ${target.itemData.name}.`, 'cyan');
                    // Announce that the item's state has changed so the UI can update
                    globalServiceLocator.eventBus.publish(GameEvents.ITEM_STATE_CHANGED, { item: target });
                }
            }

            if (skillUseData.on_success.trigger_effect) {
                const effectTarget = skillUseData.target_type === 'item' ? target as ItemInstance : undefined;
                globalServiceLocator.effectManager.triggerEffect(skillUseData.on_success.trigger_effect, actor, effectTarget);
            }
        } else {
            console.log("Skill check failed.");
            globalServiceLocator.feedback.addMessageToLog(`${actor.name} fails to use ${skillData.name} on ${targetName}.`, 'orange');
        }
    }
}
