// src/scripts/engine/entities/entity.mts
import { calcMod } from "../dataManager.mjs";
import { EntityPosition, rollD20 } from "../utils.mjs";
import { ContentItem } from "./contentItem.mjs";

export type EntityClass = {
    class: ContentItem;
    level: number;
    classSkills: string[];
    hitDice: number;
};

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

export class Entity {
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
        const strMod = calcMod(this.stats.str);

        return bab + strMod;
    }

    rollInitiative(): number {
        const d20Roll = rollD20(); // Roll d20 using utility function
        const dexMod = calcMod(this.stats.dex); // Get DEX modifier

        let initiativeRoll = d20Roll + dexMod; // Calculate total initiative
        // Add other initiative bonuses here later (feats, items, etc.)

        console.log(`${this.constructor.name} rolling initiative: d20 roll = ${d20Roll}, DEX mod = ${dexMod}, Total = ${initiativeRoll}`); // Optional log

        return initiativeRoll;
    }
}