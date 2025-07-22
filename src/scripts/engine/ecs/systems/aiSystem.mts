import { World, EntityID } from '../world.mjs';
import { globalServiceLocator } from '../../serviceLocator.mjs';
import { AIComponent, ActiveTurnComponent } from '../components/index.mjs';

/**
 * Manages the decision-making process for all AI-controlled entities.
 */
export class AISystem {
    private world: World;

    constructor() {
        this.world = globalServiceLocator.world;
    }

    /**
     * Executes the AI logic for all entities that have an active turn.
     */
    public async update(): Promise<void> {
        const scriptingService = globalServiceLocator.scriptingService;
        const entities = this.world.view(AIComponent, ActiveTurnComponent);

        for (const { entity: entityId, components: [ai, ] } of entities) {
            // In a more complex system, we would loop through ai.behaviors
            // and execute them based on priority or state.
            // For now, we'll assume the first behavior is the primary one.
            const behaviorScript = ai.behaviors[0];
            if (!behaviorScript) continue;

            try {
                // The behavior script is expected to be in `content/ai/behaviors/`
                // and should export a function like `execute(world, entityId)`
                await scriptingService.execute(
                    `content/ai/behaviors/${behaviorScript}.mjs`,
                    'execute',
                    this.world,
                    entityId
                );
            } catch (error) {
                console.error(`AISystem: Failed to execute behavior script "${behaviorScript}" for entity ${entityId}:`, error);
            }
        }
    }
}
