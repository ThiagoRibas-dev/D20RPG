import { ActiveEffect } from "../activeEffect.mjs";
import { EquipmentComponent } from "../components/equipmentComponent.mjs";
import { InventoryComponent } from "../components/inventoryComponent.mjs";
import { Renderable } from "../components/renderable.mjs";
import { ModifierManager } from "../modifierManager.mjs";
import { calculateModifier, EntityPosition, rollD20 } from "../utils.mjs";
import { ContentItem } from "./contentItem.mjs";

export type EntityClass = {
    class: ContentItem;
    level: number;
    classSkills: string[];
    hitDice: number;
}

export type EntitySkills = {
    remaining: number;
    allocations: Map<string, number>;
}

export type EntityAbilityScores = {
    [key: string]: number;
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
}

export type EntityHitPoints = {
    current: number;
    max: number;
}

export type SavingThrow = {
    base: number;
    racial_bonus: number;
    feat_bonus: number;
    misc_bonus: number;
}

export type SavingThrows = {
    [key: string]: SavingThrow;
    fortitude: SavingThrow,
    reflex: SavingThrow,
    will: SavingThrow
}

export type ActionBudget = {
    standard: number;
    move: number;
    swift: number;
    free: number;
    hasTaken5FootStep: boolean;
    movementPoints: number;
}

export class Entity {
    id: string;
    name: string;
    selectedRace: ContentItem | null;
    classes: EntityClass[];
    totalLevel: number;
    skills: EntitySkills;
    feats: ContentItem[];
    position: EntityPosition;
    stats: EntityAbilityScores;
    hitPoints: EntityHitPoints;
    baseAttackBonus: number;
    savingThrows: SavingThrows;
    activeEffects: ActiveEffect[];
    renderable: Renderable | null;
    actionBudget: ActionBudget;
    public inventory: InventoryComponent;
    public equipment: EquipmentComponent;
    public tags: Set<string>;

    // We store the BASE stats, not the final ones.
    public baseStats: EntityAbilityScores;

    // A map for every modifiable value in the game.
    // The key is the target (e.g., "stats.str", "saves.will", "skills.spot")
    public modifiers: ModifierManager;

    constructor(
        name: string = "",
        selectedRace: ContentItem | null = null,
        classes: EntityClass[] = [],
        totalLevel: number = 0,
        skills: EntitySkills = { remaining: 0, allocations: new Map() },
        feats: ContentItem[] = [],
        position: EntityPosition = { x: 1, y: 1 },
        stats: EntityAbilityScores = {
            str: 10,
            dex: 10,
            con: 10,
            int: 10,
            wis: 10,
            cha: 10,
        },
        hitPoints: EntityHitPoints = { current: 0, max: 0 },
        baseAttackBonus: number = 0
    ) {
        this.id = `entity-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        this.name = name;
        this.selectedRace = selectedRace;
        this.classes = classes;
        this.totalLevel = totalLevel;
        this.skills = skills;
        this.feats = feats;
        this.position = position;
        this.stats = stats;
        this.hitPoints = hitPoints;
        this.baseAttackBonus = baseAttackBonus;
        this.activeEffects = []; this.savingThrows = {
            fortitude: { base: 0, racial_bonus: 0, feat_bonus: 0, misc_bonus: 0 },
            reflex: { base: 0, racial_bonus: 0, feat_bonus: 0, misc_bonus: 0 },
            will: { base: 0, racial_bonus: 0, feat_bonus: 0, misc_bonus: 0 }
        };
        this.renderable = null;

        this.baseStats = stats;
        this.modifiers = new ModifierManager();
        this.actionBudget = {
            standard: 1,
            move: 1,
            swift: 1,
            free: 99,
            hasTaken5FootStep: false,
            movementPoints: 0
        }
        this.inventory = new InventoryComponent(this);
        this.equipment = new EquipmentComponent(this);
        this.tags = new Set<string>();
        this.updateTags();
    }

    /**
        * Calculates the total bonus for a given skill, including the
        * relevant ability modifier.
        * @param skillId The ID of the skill (e.g., "spot").
        * @returns The final skill modifier.
        */
    public getSkillModifier(skillId: string): number {
        // In a real implementation, you would look up the skill's key ability (e.g., WIS for Spot)
        const keyAbilityScore = this.stats.wis; // Placeholder
        const abilityMod = calculateModifier(keyAbilityScore);

        const ranks = this.getSkillRank(skillId);

        const otherBonuses = this.modifiers.get(`skills.${skillId}`)?.getTotal() || 0;

        return ranks + abilityMod + otherBonuses;
    }

    /**
     * Calculates effective skill ranks based on points spent and class skills.
     * @param skillId ID from content/skills.
     * @returns The number of ranks in the skill.
     */
    public getSkillRank(skillId: string): number {
        const pointsSpent = this.skills.allocations.get(skillId) || 0;
        const isClassSkill = this.classes.some(cls =>
            cls.classSkills.includes(skillId) // This requires skill names to be consistent
        );
        return isClassSkill ? pointsSpent : Math.floor(pointsSpent / 2);
    }

    /**
    * Recalculates and updates the entity's cached tag set.
    * This should be called whenever race, classes, or effects change.
    */
    public updateTags(): void {
        this.tags.clear();

        // 1. Get tags from the race
        this.selectedRace?.tags?.forEach((tag: string) => this.tags.add(tag));

        // 2. Get tags from all classes
        this.classes.forEach(cls => {
            cls.class.tags?.forEach((tag: string) => this.tags.add(tag));
        });

        // 3. Get tags from all active effects (feats, spells, etc.)
        this.activeEffects.forEach(effect => {
            effect.sourceEffect.tags?.forEach((tag: string) => this.tags.add(tag));
        });
    }

    /**
     * Checks if the entity possesses a specific tag from any source.
     * This is the primary interface for the rest of the engine.
     * @param {string} tag - The tag to check for.
     * @returns {boolean} True if the entity has the tag, false otherwise.
     */
    public hasTag(tag: string): boolean {
        return this.tags.has(tag);
    }

    takeDamage(amount: number) {
        this.hitPoints.current -= amount;
        if (this.hitPoints.current < 0) {
            this.hitPoints.current = 0;
        }
    }

    isAlive(): boolean {
        return this.hitPoints.current > 0;
    }

    rollInitiative(): number {
        const d20Roll = rollD20(); // Roll d20 using utility function
        const dexMod = calculateModifier(this.stats.dex); // Get DEX modifier

        let initiativeRoll = d20Roll + dexMod; // Calculate total initiative
        // Add other initiative bonuses here later (feats, items, etc.)

        console.log(`${this.constructor.name} rolling initiative: d20 roll = ${d20Roll}, DEX mod = ${dexMod}, Total = ${initiativeRoll}`); // Optional log

        return initiativeRoll;
    }

    /**
        * Retrieves the weapon the entity is currently wielding.
        */
    public getEquippedWeapon(): ContentItem {
        const unarmed = new ContentItem("item");
        unarmed.name = "Unarmed";
        unarmed.tags = ["weapon", "melee", "simple", "bludgeoning", "unarmer", "one_handed"];
        return this.equipment.slots.main_hand?.itemData || unarmed;
    }

    /**
     * Calculates the entity's Armor Class.
     * MVP: Returns a simple 10 + DEX modifier.
     * TODO: This should use the ModifierList system to account for armor, shields, etc.
     */
    public getArmorClass(): number {
        const baseAC = 10;
        const dexMod = calculateModifier(this.stats.dex);

        // Cap DEX bonus based on equipped armor
        const maxDex = this.modifiers.get('ac.max_dex')?.getLowest() ?? 99; // Get lowest value (most restrictive)
        const cappedDexMod = Math.min(dexMod, maxDex);

        const armorBonuses = this.modifiers.get('ac')?.getTotal() || 0;

        return baseAC + cappedDexMod + armorBonuses;
    }
}
