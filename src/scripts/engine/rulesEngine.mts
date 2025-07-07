import { ContentItem } from "./entities/contentItem.mjs";
import { Entity, EntityClass } from "./entities/entity.mjs";
import { ModifierList } from "./entities/modifier.mjs";
import { globalServiceLocator } from "./serviceLocator.mjs";
import { calculateModifier, rollD20 } from "./utils.mjs";

/**
 * The RulesEngine is the central authority for all game rule calculations.
 * It processes stats, validates actions, and resolves combat events.
 */
export class RulesEngine {
    constructor() {
        globalServiceLocator.eventBus.subscribe('action:attack:declared',
            (data) => this.resolveAttack(data)
        );
    }

    /**
    * Manages the entire resolution of a single attack, from roll to outcome.
    * This is the heart of the combat event chain.
    */
    private resolveAttack(data: { attacker: Entity, target: Entity, weapon: ContentItem }): void {
        const { attacker, target, weapon } = data;
        console.log(`--- Resolving attack from ${attacker.name} to ${target.name} ---`);

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
                misc: new ModifierList(), // For Power Attack, Bless, etc.
                final: 0,
            },
            outcome: 'pending' as 'pending' | 'miss' | 'hit' | 'critical_threat',
            // ... damage context would go here later
        };

        // 2. FIRE "BEFORE_ROLL" EVENT
        // This gives other systems (feats, spells) a chance to modify the attack.
        globalServiceLocator.eventBus.publish('action:attack:before_roll', attackContext);

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

        console.log(`Attack Roll: ${attackContext.attackRoll.final} vs AC ${targetAC} -> ${attackContext.outcome.toUpperCase()}`);

        // 7. FIRE "RESOLVED" EVENT
        // Announce the final result of the attack roll.
        globalServiceLocator.eventBus.publish('action:attack:resolved', attackContext);

        // 8. HANDLE DAMAGE (if it was a hit)
        if (attackContext.outcome === 'hit' || attackContext.outcome === 'critical_threat') {
            // TODO: Kick off the damage calculation chain here.
            // For now, we just log it.
            console.log("Attack hits! (Damage calculation would happen here)");
            target.takeDamage(5); // Apply 5 placeholder damage
            globalServiceLocator.eventBus.publish('character:hp:changed', { entity: target });
            if (!target.isAlive()) {
                globalServiceLocator.eventBus.publish('character:died', { entity: target, killer: attacker });
            }
        }
    }

    /**
     * Calculates all permanent stats and modifiers for an entity.
     * This is the "Permanent Layer" of the pipeline. It should be called
     * upon character finalization and level-up.
     */
    public calculateStats(entity: Entity): void {
        console.log(`Calculating stats for ${entity.name}...`);
        entity.modifiers.clear(); // Start fresh

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
        totalHP += entity.modifiers.get('hit_points')?.getTotal() || 0;

        entity.hitPoints.max = totalHP;
        entity.hitPoints.current = totalHP;

        console.log(`${entity.name} stats calculated.`, entity);

        // --- THE NEW ADDITION ---
        // Announce that the calculation for this entity is complete.
        // Any system that needs to react to the final stats can listen for this.
        globalServiceLocator.eventBus.publish('entity:stats:calculated', { entity });
    }

    private addModifier(entity: Entity, target: string, value: number, type: string, source: string) {
        if (!entity.modifiers.has(target)) {
            entity.modifiers.set(target, new ModifierList());
        }
        entity.modifiers.get(target)!.add({ value, type, source });
    }
}