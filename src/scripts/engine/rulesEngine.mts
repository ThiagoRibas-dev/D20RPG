import { ItemInstance } from "./components/itemInstance.mjs";
import { ContentItem } from "./entities/contentItem.mjs";
import { Entity, EntityClass } from "./entities/entity.mjs";
import { ModifierManager } from "./modifierManager.mjs";
import { MapTile } from "./entities/mapTile.mjs";
import { ModifierList } from "./entities/modifier.mjs";
import { MoveAction } from "./actions/moveAction.mjs";
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
    }

    /**
    * Manages the entire resolution of a single attack, from roll to outcome.
    * This is the heart of the combat event chain.
    */
    private resolveAttack(data: { attacker: Entity, target: Entity, weapon: ContentItem }): void {
        const { attacker, target, weapon } = data;
        console.log(`--- Resolving attack from ${attacker.name} to ${target.name} ---`);

        // If we aren't in combat and this is a hostile action, start combat.
        if (!globalServiceLocator.turnManager.isCombatActive) {
            // In the future check faction alignment etc. For now, any attack starts combat.
            console.log("Hostile action taken outside of combat. Initiating combat!");
            globalServiceLocator.turnManager.startCombat([attacker, target]);
            // We let the attack resolve
        }

        // 1. CREATE CONTEXT
        // This object will hold all data for this single attack.
        const attackContext = {
            attacker,
            target,
            weapon,
            attackRoll: {
                d20: 0,
                base: attacker.baseAttackBonus,
                abilityMod: calculateModifier(attacker.stats.str), // Assuming melee for now
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
        } else if (attackContext.attackRoll.d20 >= this.parseThreatRange(weapon.critical?.threatRange || "20")) {
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

    /**
     * Calculates all permanent stats and modifiers for an entity.
     * This is the "Permanent Layer" of the pipeline. It should be called
     * upon character finalization and level-up.
     */
    public calculateStats(entity: Entity): void {
        console.log(`Calculating stats for ${entity.name}...`);
        entity.modifiers = new ModifierManager(); // Start fresh

        // --- 1. GATHER SOURCES ---
        const sources: ContentItem[] = [];
        if (entity.selectedRace) sources.push(entity.selectedRace);
        entity.feats.forEach(feat => sources.push(feat));
        entity.classes.forEach(cls => {
            for (let i = 0; i < cls.level; i++) {
                const levelData = cls.class.level_progression[i];
                levelData?.special?.forEach((ability: any) => sources.push(ability));
            }
        });

        // --- 2. APPLY DECLARATIVE BONUSES ---
        sources.forEach(source => {
            source.bonuses?.forEach((bonus: any) => {
                if (bonus.target) {
                    this.addModifier(entity, bonus.target, bonus.value, bonus.type || 'untyped', source.name);
                }
            });
        });

        // --- 3. CALCULATE BASE VALUES FROM CLASS AND STATS ---
        let baseAttackBonus = 0;
        let baseFort = 0, baseRef = 0, baseWill = 0;
        entity.classes.forEach((cls: EntityClass) => {
            const classData = cls.class;
            const levelData = classData.level_progression[cls.level - 1];
            if (levelData) {
                baseAttackBonus += levelData.base_attack_bonus;
                baseFort += levelData.fortitude_save;
                baseRef += levelData.reflex_save;
                baseWill += levelData.will_save;
            }
        });
        entity.baseAttackBonus = baseAttackBonus;
        this.addModifier(entity, 'saves.fortitude', baseFort, 'base', 'Class Level');
        this.addModifier(entity, 'saves.reflex', baseRef, 'base', 'Class Level');
        this.addModifier(entity, 'saves.will', baseWill, 'base', 'Class Level');

        // Add ability score modifiers to saves
        this.addModifier(entity, 'saves.fortitude', calculateModifier(entity.stats.con), 'ability', 'Constitution');
        this.addModifier(entity, 'saves.reflex', calculateModifier(entity.stats.dex), 'ability', 'Dexterity');
        this.addModifier(entity, 'saves.will', calculateModifier(entity.stats.wis), 'ability', 'Wisdom');

        // --- 4. CALCULATE FINAL HIT POINTS ---
        let totalHP = 0;
        const conMod = calculateModifier(entity.stats.con);
        entity.classes.forEach(cls => {
            const hitDie = parseInt(cls.class.hit_die.replace('d', ''), 10);
            const avgHP = (hitDie / 2) + 1;
            totalHP += Math.max(1, (avgHP + conMod)) * cls.level;
        });

        // Add HP bonuses from feats like Toughness
        totalHP += entity.modifiers.getValue('hit_points', 0);

        entity.hitPoints.max = totalHP;
        entity.hitPoints.current = totalHP;

        console.log(`${entity.name} stats calculated.`, entity);

        // Announce that the calculation for this entity is complete.
        // Any system that needs to react to the final stats can listen for this.
        globalServiceLocator.eventBus.publish(GameEvents.ENTITY_STATS_CALCULATED, { entity });
    }

    private addModifier(entity: Entity, target: string, value: number, type: string, source: string) {
        // The ModifierManager handles the creation of the list if it doesn't exist.
        // We just create the modifier object and add it.
        entity.modifiers.add({ value, type, source, target });
    }

    private resolveDamage(context: any): void {
        const { attacker, target, weapon, damageRoll, isCritical } = context;

        // 1. Add ability modifier to bonus
        const strMod = calculateModifier(attacker.stats.str);
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
        target.takeDamage(damageRoll.total);
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

        const prevPlayerPosition = { ...actor.position };
        if (!prevPlayerPosition) {
            console.log("Actor's Original Position is not initialized");
            return;
        }

        // Find adjacent hostile enemies who are threatening the starting square.
        const threateningNpcs = globalServiceLocator.state.npcs.filter(npc =>
            npc.isAlive() &&
            npc.disposition === 'hostile' && // Or based on faction
            (Math.abs(npc.position.x - prevPlayerPosition.x) <= 1 && Math.abs(npc.position.y - prevPlayerPosition.y) <= 1)
        );

        // If there are threats, we publish the interrupt event and DO NOT complete the move yet.
        if (threateningNpcs.length > 0) {
            console.log(`${actor.name}'s movement provokes an AoO from ${threateningNpcs.map(n => n.name).join(', ')}!`);
            globalServiceLocator.eventBus.publish(GameEvents.ACTION_PROVOKES_AOO, {
                provokingActor: actor,
                threateningActors: threateningNpcs,
                continuationAction: new MoveAction(actor, direction)
            });
            return; // STOP execution of the move. It will be resumed later.
        }

        // If no one threatens, complete the move immediately.
        this.executeMove(actor, direction);
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
        const skillRoll = rollD20() + actor.getSkillModifier(skillId);

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
