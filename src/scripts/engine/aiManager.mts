import { globalServiceLocator } from './serviceLocator.mjs';
import { Entity } from './entities/entity.mjs';
import { Action } from './actions/action.mjs';
import { AIBehavior } from './ai/aiBehavior.mjs';
import { PassTurnAction } from './actions/passTurnAction.mjs';

export class AIManager {
    private behaviors: Map<string, AIBehavior> = new Map();

    constructor() {
        // This is where we would dynamically load behaviors, for now we'll hardcode them
    }

    registerBehavior(name: string, behavior: AIBehavior) {
        this.behaviors.set(name, behavior);
    }

    processTurn(entity: Entity): Action {
        if (!entity.ai_flags || entity.ai_flags.length === 0) {
            return new PassTurnAction(entity);
        }

        let bestBehavior: AIBehavior | null = null;
        let bestScore = -1;

        const context = {
            player: globalServiceLocator.state.player,
            // In the future, we can add more context like allies, enemies, etc.
        };

        for (const flag of entity.ai_flags) {
            const behavior = this.behaviors.get(flag);
            if (behavior) {
                const score = behavior.evaluate(entity, context);
                if (score > bestScore) {
                    bestScore = score;
                    bestBehavior = behavior;
                }
            }
        }

        if (bestBehavior) {
            return bestBehavior.execute(entity, context);
        }

        return new PassTurnAction(entity);
    }
}
