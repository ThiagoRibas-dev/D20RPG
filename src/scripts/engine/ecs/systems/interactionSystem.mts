import { World, EntityID } from '../world.mjs';
import { globalServiceLocator } from '../../serviceLocator.mjs';
import { TagsComponent } from '../components/tagsComponent.mjs';

/**
 * A temporary component added to an entity to signify that it intends to perform an interaction.
 */
export class InteractIntentComponent {
    constructor(public sourceId: EntityID, public targetId: EntityID) {}
}

/**
 * Handles all interactions between entities, such as dipping items or throwing potions.
 */
export class InteractionSystem {
    private world: World;

    constructor() {
        this.world = globalServiceLocator.world;
    }

    public update(): void {
        const entities = this.world.view(InteractIntentComponent);

        for (const { entity: entityId, components: [intent] } of entities) {
            const sourceTags = this.world.getComponent(intent.sourceId, TagsComponent);
            const targetTags = this.world.getComponent(intent.targetId, TagsComponent);

            if (sourceTags && targetTags) {
                // In a real implementation, we would look up the interaction
                // in a data file (e.g., interactions.json) based on the tags
                // of the source and target entities.
                console.log(`InteractionSystem: Entity ${intent.sourceId} is interacting with ${intent.targetId}.`);
            }

            // Remove the intent component after processing.
            this.world.removeComponent(entityId, InteractIntentComponent);
        }
    }
}
