import { EntityPosition } from "../utils.mjs";
import { ContentItem } from "./contentItem.mjs";
import { Entity, EntityAbilityScores, EntityClass, EntityHitPoints, EntitySkills } from "./entity.mjs";

export class PlayerCharacter extends Entity {
    constructor(
        name: string = "",
        selectedRace: ContentItem | null = null,
        template: ContentItem | null = null,
        classes: EntityClass[] = [],
        totalLevel: number = 0,
        skills: EntitySkills = { remaining: 0, allocations: new Map() },
        feats: ContentItem[] = [],
        position: EntityPosition = { x: 1, y: 1 },
        stats: EntityAbilityScores = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        hitPoints: EntityHitPoints = { current: 0, max: 0 },
        baseAttackBonus: number = 0
    ) {
        super(name, selectedRace, template, classes, totalLevel, skills, feats, position, stats, hitPoints, baseAttackBonus);

        // Define the player's appearance via the Renderable component.
        this.renderable = {
            char: '@',
            color: 'yellow',
            layer: 5 // 5 is the standard "creature" layer
        };
    }
}
