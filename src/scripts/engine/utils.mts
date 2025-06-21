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