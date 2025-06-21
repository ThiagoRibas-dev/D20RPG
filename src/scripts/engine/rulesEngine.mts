import { ContentItem } from "./entities/contentItem.mjs";
import { Entity, EntityClass } from "./entities/entity.mjs";
import { UIHolder } from "./entities/uiHolder.mjs";
import { globalServiceLocator } from "./serviceLocator.mjs";
import { calculateModifier } from "./utils.mjs";

/**
 * The RulesEngine is the central authority for all game rule calculations.
 * It processes stats, validates actions, and resolves combat events.
 */
export class RulesEngine {
    constructor() {
        // In the future, this constructor will subscribe to game events.
    }

    // New helper function
    public calculateBaseHitPoints(): { current: number; max: number } {
        const player = globalServiceLocator.state.player;
        if (!player) {
            console.log("Player is not initialized");
            return { current: 0, max: 0 };
        }

        let total = 0;
        player.classes.forEach(cls => {
            const conMod = calculateModifier(player.stats.con);
            total += Math.max(1, cls.hitDice + conMod);
        });
        return { current: total, max: total };
    }
    /**
     * Calculates the final, derived stats for an entity based on the Stat Pipeline.
     * This processes the Base and Permanent layers of calculation.
     * @param entity The entity whose stats need to be calculated.
     */
    public calculateStats(entity: Entity): void {
        console.log(`Calculating stats for ${entity.name}...`);

        // --- 1. BASE LAYER ---
        // Base stats are already on the entity from character creation.

        // --- 2. PERMANENT LAYER ---
        // Apply bonuses from race and declarative feats.

        // Gather all sources of permanent, declarative bonuses.
        const permanentBonusSources: ContentItem[] = [];
        if (entity.selectedRace) {
            permanentBonusSources.push(entity.selectedRace);
        }
        entity.feats.forEach(feat => {
            // A feat is considered declarative if it has a 'bonuses' array and no script.
            if (feat.bonuses && !feat.script) {
                permanentBonusSources.push(feat);
            }
        });

        // Apply class level progression for BAB and Base Saves
        entity.baseAttackBonus = 0;
        entity.savingThrows.fortitude.base = 0;
        entity.savingThrows.reflex.base = 0;
        entity.savingThrows.will.base = 0;

        entity.classes.forEach((cls: EntityClass) => {
            const classData = cls.class;
            const levelData = classData.level_progression[cls.level - 1];
            if (levelData) {
                entity.baseAttackBonus += levelData.base_attack_bonus;
                entity.savingThrows.fortitude.base += levelData.fortitude_save;
                entity.savingThrows.reflex.base += levelData.reflex_save;
                entity.savingThrows.will.base += levelData.will_save;
            }
        });

        // Apply bonuses from the sources
        permanentBonusSources.forEach(source => {
            if (!source.bonuses || !Array.isArray(source.bonuses)) return;

            source.bonuses.forEach((bonus: any) => {
                switch (bonus.type) {
                    case 'hit_points':
                        entity.hitPoints.max += bonus.value;
                        break;
                    case 'save':
                        const savingThrowName: string = bonus.subtype;
                        if (bonus.subtype && entity.savingThrows[savingThrowName]) {
                            entity.savingThrows[savingThrowName].racial_bonus += bonus.value; // Or some other bonus type
                        }
                        break;
                    case 'skill':
                        // Skill bonuses will need a dedicated map on the entity.
                        // For now, we log it.
                        console.log(`Applying +${bonus.value} to ${bonus.subtype} skill.`);
                        break;
                    // Other bonus types (attack, AC, etc.) can be added here.
                }
            });
        });

        // --- Final Recalculations ---
        // Recalculate HP based on final CON and Hit Dice
        let totalHP = 0;
        const conMod = calculateModifier(entity.stats.con);
        entity.classes.forEach(cls => {
            const hitDie = cls.class.hit_die.replace('d', '');
            // For simplicity, we'll take average HP. A real implementation might store rolled values.
            const avgHP = (parseInt(hitDie, 10) / 2) + 1;
            totalHP += Math.max(1, (avgHP + conMod)) * cls.level;
        });

        // Add HP from declarative feats like Toughness
        permanentBonusSources.forEach(source => {
            source.bonuses?.forEach((bonus: any) => {
                if (bonus.type === 'hit_points') totalHP += bonus.value;
            });
        });

        entity.hitPoints.max = totalHP;
        entity.hitPoints.current = totalHP; // Start with full health

        console.log(`${entity.name} stats calculated:`, entity);
    }

    /**
     * Calculates effective skill ranks for checks/display
     * @param skillId - ID from content/skills
     * @returns Effective ranks (including cross-class penalties)
     */
    public getSkillRank(skillId: string): number {
        const player = globalServiceLocator.state.player;
        if (!player) {
            console.log("Player is not initialized");
            return 0;
        }

        const pointsSpent = player.skills.allocations.get(skillId) || 0;
        const isClassSkill = player.classes.some(cls =>
            cls.classSkills.includes(skillId)
        );
        return isClassSkill ? pointsSpent : pointsSpent / 2;
    }

    public getElAbilityScores(uiScreens: UIHolder): { [key: string]: HTMLInputElement } {
        return {
            str: uiScreens.inputs.str,
            dex: uiScreens.inputs.dex,
            con: uiScreens.inputs.con,
            int: uiScreens.inputs.int,
            wis: uiScreens.inputs.wis,
            cha: uiScreens.inputs.cha,
        };
    }

    public calculateCurrentAbilityPoints(el: { [key: string]: HTMLInputElement }): number {
        let total = 0;
        Object.values(el).forEach((value, i) => {
            if (i < Object.values(el).length - 1) { total += this.pointBuyCost(parseInt(value.value)) };
        })
        return total;
    }

    public pointBuyCost(roll: number) {
        let cost = 0;
        if (roll > 18) {
            cost += (roll - 18) * 3;
            roll = 18;
        }
        if (roll > 13) {
            cost += (roll - 13) * 2;
            roll = 13;
        }
        if (roll > 8) {
            cost += (roll - 8);
        }
        return cost;
    }
}