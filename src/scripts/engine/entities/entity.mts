import { ActiveEffect } from "../activeEffect.mjs";
import { Renderable } from "../components/renderable.mjs";
import { globalServiceLocator } from "../serviceLocator.mjs";
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
    }

    /**
    * Gathers all tags from the entity's race, classes, and active effects.
    * Uses a Set to automatically handle duplicates.
    * @returns {Set<string>} A set of all unique tags for this entity.
    */
    public getTags(): Set<string> {
        const allTags = new Set<string>();

        // 1. Get tags from the race
        this.selectedRace?.tags?.forEach((tag: string) => allTags.add(tag));

        // 2. Get tags from all classes
        this.classes.forEach(cls => {
            cls.class.tags?.forEach((tag: string) => allTags.add(tag));
        });

        // 3. Get tags from all active effects (feats, spells, etc.)
        this.activeEffects.forEach(effect => {
            effect.sourceEffect.tags?.forEach((tag: string) => allTags.add(tag));
        });

        return allTags;
    }

    /**
     * Checks if the entity possesses a specific tag from any source.
     * This is the primary interface for the rest of the engine.
     * @param {string} tag - The tag to check for.
     * @returns {boolean} True if the entity has the tag, false otherwise.
     */
    public hasTag(tag: string): boolean {
        // For performance, we could cache the result of getTags() if it becomes a bottleneck,
        // but for now, direct computation is cleaner.
        return this.getTags().has(tag);
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

    calculateAttackBonus(): number {
        const bab = this.baseAttackBonus;
        const strMod = calculateModifier(this.stats.str);

        return bab + strMod;
    }

    rollInitiative(): number {
        const d20Roll = rollD20(); // Roll d20 using utility function
        const dexMod = calculateModifier(this.stats.dex); // Get DEX modifier

        let initiativeRoll = d20Roll + dexMod; // Calculate total initiative
        // Add other initiative bonuses here later (feats, items, etc.)

        console.log(`${this.constructor.name} rolling initiative: d20 roll = ${d20Roll}, DEX mod = ${dexMod}, Total = ${initiativeRoll}`); // Optional log

        return initiativeRoll;
    }
}