import { EntityID } from "./ecs/world.mjs";
import { PositionComponent } from "./ecs/components/index.mjs";
import { globalServiceLocator } from "./serviceLocator.mjs";
import { Point } from "../utils/point.mjs";

export type EntityPosition = {
    x: number,
    y: number
}

export const MOVE_DIRECTIONS: { [key: string]: EntityPosition } = {
    // Y-axis is usually inverted in screen coordinates (0,0 at top-left)
    UP: { x: 0, y: -1 } as EntityPosition,
    DOWN: { x: 0, y: 1 } as EntityPosition,
    LEFT: { x: -1, y: 0 } as EntityPosition,
    RIGHT: { x: 1, y: 0 } as EntityPosition,
};

export function getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function rollD20(): number {
    return getRandomInt(1, 20);
}

/**
 * Calculates the ability score modifier for a given score.
 * @param score The ability score (e.g., 14).
 * @returns The modifier (e.g., +2).
 */
export function calculateModifier(score: number): number {
    return Math.floor((score - 10) / 2);
}

export function getAdjacentEntities(entityId: EntityID): EntityID[] {
    const adjacentEntities: EntityID[] = [];
    const world = globalServiceLocator.world;
    const sourcePosition = world.getComponent(entityId, PositionComponent);

    if (!sourcePosition) {
        return [];
    }

    const allEntities = world.getEntitiesWith(PositionComponent);

    for (const otherEntityId of allEntities) {
        if (entityId === otherEntityId) {
            continue;
        }

        const otherPosition = world.getComponent(otherEntityId, PositionComponent);
        if (otherPosition) {
            const dx = Math.abs(otherPosition.x - sourcePosition.x);
            const dy = Math.abs(otherPosition.y - sourcePosition.y);
            if ((dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0)) {
                adjacentEntities.push(otherEntityId);
            }
        }
    }
    return adjacentEntities;
}

/**
 * Deeply merges properties from a source object into a target object.
 * Arrays are concatenated.
 * @param target The object to merge into.
 * @param source The object to merge from.
 */
export function deepMerge(target: any, source: any): any {
    for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            if (source[key] instanceof Object && key in target) {
                // If the key exists in target and both are objects, recurse
                target[key] = deepMerge(target[key], source[key]);
            } else if (Array.isArray(source[key]) && Array.isArray(target[key])) {
                // If both are arrays, concatenate them
                target[key] = target[key].concat(source[key]);
            }
            else {
                // Otherwise, just assign the value
                target[key] = source[key];
            }
        }
    }
    return target;
}

export function isPoint(p: any): p is Point {
    return p && typeof p.x === 'number' && typeof p.y === 'number';
}
