// src/scripts/engine/entities/monster.mts
import { EntityPosition } from "../utils.mjs";
import { ContentItem } from "./contentItem.mjs";
import { Entity, EntityAbilityScores, EntityHitPoints } from "./entity.mjs";

export class Monster extends Entity {
    prefabId: string;
    ascii_char: string;
    color: string;

    constructor(
        name: string,
        prefabId: string,
        selectedRace: ContentItem | null = null,
        position: EntityPosition = { x: 0, y: 0 },
        stats: EntityAbilityScores = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        hitPoints: EntityHitPoints = { current: 10, max: 10 },
        ascii_char: string = 'M',
        color: string = 'red'
    ) {
        super(name, selectedRace, [], 0, { remaining: 0, allocations: new Map() }, [], position, stats, hitPoints);
        this.prefabId = prefabId;
        this.ascii_char = ascii_char;
        this.color = color;
    }
}