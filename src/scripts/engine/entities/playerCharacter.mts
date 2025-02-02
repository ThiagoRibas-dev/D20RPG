// src/scripts/engine/playerCharacter.mts
import { PlayerPosition as PositionXY } from "../utils.mjs";
import { ContentItem } from "./contentItem.mjs";

export type PlayerClass = {
    class: ContentItem;
    level: number;
    classSkills: string[]; // Specific to this class level
    hitDice: number; // Track individual class HD
};

export type PlayerCharacter = {
    selectedRace: ContentItem | null;
    classes: PlayerClass[];
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
    position: PositionXY;
};