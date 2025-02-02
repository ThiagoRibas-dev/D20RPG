// src/scripts/engine/utils.mts

export type PlayerPosition = {
    x: number,
    y: number
}

export const MOVE_DIRECTIONS: { [key: string]: PlayerPosition } = {
    // Y-axis is usually inverted in screen coordinates (0,0 at top-left)
    UP: { x: 0, y: -1 } as PlayerPosition,
    DOWN: { x: 0, y: 1 } as PlayerPosition,
    LEFT: { x: -1, y: 0 } as PlayerPosition,
    RIGHT: { x: 1, y: 0 } as PlayerPosition,
};

export function getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}