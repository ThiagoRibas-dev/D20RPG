import { World, EntityID } from '../world.mjs';
import { globalServiceLocator } from '../../serviceLocator.mjs';
import { PositionComponent } from '../components/positionComponent.mjs';
import { MovedOutOfThreatenedSquareComponent } from './interruptSystem.mjs';

/**
 * A temporary component added to an entity to signify that it intends to move.
 */
export class MoveIntentComponent {
    constructor(public x: number, public y: number) {}
}

/**
 * Handles all entity movement, including collision detection and movement cost calculation.
 */
export class MovementSystem {
    private world: World;

    constructor() {
        this.world = globalServiceLocator.world;
    }

    public update(): void {
        const entities = this.world.view(MoveIntentComponent, PositionComponent);

        for (const { entity: entityId, components: [intent, position] } of entities) {
            const newX = position.x + intent.x;
            const newY = position.y + intent.y;

            const mapData = globalServiceLocator.state.currentMapData;
            if (mapData && mapData.tiles[newY][newX] !== '#') {
                position.x = newX;
                position.y = newY;
            }

            // This is a placeholder for threat detection.
            // A real implementation would check if the entity moved out of a square
            // threatened by an enemy.
            const threatenedBy: EntityID[] = []; // Example: [enemyId1, enemyId2]
            if (threatenedBy.length > 0) {
                this.world.addComponent(entityId, new MovedOutOfThreatenedSquareComponent(threatenedBy));
            }

            // Remove the intent component after processing.
            this.world.removeComponent(entityId, MoveIntentComponent);
        }
    }
}
