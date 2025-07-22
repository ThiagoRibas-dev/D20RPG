import { Point } from '../utils/point.mjs';

interface TileState {
    tag: string;
    duration: number; // in rounds, -1 for infinite
}

export class TileStateManager {
    private tileStates: Map<string, TileState[]> = new Map();

    private getKey(position: Point): string {
        return `${position.x},${position.y}`;
    }

    addState(position: Point, tag: string, duration: number): void {
        const key = this.getKey(position);
        const states = this.tileStates.get(key) || [];

        // Avoid duplicate states, maybe refresh duration instead
        const existingState = states.find(s => s.tag === tag);
        if (existingState) {
            existingState.duration = Math.max(existingState.duration, duration);
            return;
        }

        states.push({ tag, duration });
        this.tileStates.set(key, states);
    }

    removeState(position: Point, tag: string): void {
        const key = this.getKey(position);
        const states = this.tileStates.get(key);
        if (states) {
            const newStates = states.filter(s => s.tag !== tag);
            if (newStates.length > 0) {
                this.tileStates.set(key, newStates);
            } else {
                this.tileStates.delete(key);
            }
        }
    }

    getTagsAt(position: Point): string[] {
        const key = this.getKey(position);
        const states = this.tileStates.get(key) || [];
        return states.map(s => s.tag);
    }

    updateDurations(): void {
        for (const [key, states] of this.tileStates.entries()) {
            const newStates = states.reduce((acc, state) => {
                if (state.duration > 0) {
                    state.duration--;
                }
                if (state.duration !== 0) {
                    acc.push(state);
                }
                return acc;
            }, [] as TileState[]);

            if (newStates.length > 0) {
                this.tileStates.set(key, newStates);
            } else {
                this.tileStates.delete(key);
            }
        }
    }
}
