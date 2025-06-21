import { EntityPosition } from "../utils.mjs";
import { ContentItem } from "./contentItem.mjs";
import { Entity, EntityAbilityScores, EntityHitPoints } from "./entity.mjs";

export class Npc extends Entity {
    prefabId: string;
    public aiPackage: any | null = null;
    public disposition: 'friendly' | 'neutral' | 'hostile' = 'neutral';

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

        this.renderable = {
            char: ascii_char,
            color: color,
            layer: 5
        };
    }
}