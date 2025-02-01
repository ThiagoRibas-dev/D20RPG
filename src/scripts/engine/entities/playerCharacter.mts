// src/scripts/engine/playerCharacter.mts
import { ContentItem } from "./contentItem.mjs";

export type PlayerCharacter = {
    selectedRace: ContentItem | null;
    classes: {
        class: ContentItem;
        level: number;
        classSkills: string[]; // Specific to this class level
        hitDice: number; // Track individual class HD
    }[];
    totalLevel: number;
    stats: { [key: string]: number };
    hitPoints: {
        current: number;
        max: number; // Calculated from class HD + CON mod
    };
    skillPoints: {
        remaining: number;
        // Track spent points per class
        allocations: Map<string, number>; // <skillId, ranks>
    };
    feats: ContentItem[];
};