import { World, EntityID } from '../world.mjs';
import { globalServiceLocator } from '../../serviceLocator.mjs';
import { ReadyActionComponent } from '../components/readyActionComponent.mjs';
import { Action } from '../../actions/action.mjs';

export interface Interrupt {
    sourceEntity: EntityID;
    potentialActions: Action[];
}

// --- Temporary Flag Components for Interrupts ---

/**
 * A temporary component added to an entity when it performs an action
 * that could provoke an Attack of Opportunity (e.g., moving out of a threatened square).
 */
export class MovedOutOfThreatenedSquareComponent {
    constructor(public threatenedBy: EntityID[]) {}
}

/**
 * A temporary component added when an entity attempts to cast a spell,
 * which can be interrupted.
 */
export class SpellCastComponent {
    constructor(public spellId: string) {}
}


/**
 * Manages the game's interrupt logic, such as Attacks of Opportunity.
 * It looks for temporary "flag" components and triggers the appropriate reactions.
 */
export class InterruptSystem {
    private world: World;

    constructor() {
        this.world = globalServiceLocator.world;
    }

    public update(): void {
        this.handleAttacksOfOpportunity();
        this.handleReadyActions();
        // Other interrupt handlers would go here
    }

    private handleAttacksOfOpportunity(): void {
        const entities = this.world.view(MovedOutOfThreatenedSquareComponent);

        for (const { entity: entityId, components: [movedComponent] } of entities) {
            for (const attackerId of movedComponent.threatenedBy) {
                // In a real implementation, we would check if the attacker
                // is able and willing to make an attack of opportunity.
                console.log(`InterruptSystem: Entity ${attackerId} would make an Attack of Opportunity against ${entityId}.`);

                // This is where we would add an ExecuteActionComponent to the attacker,
                // targeting the entity that moved.
                // Example:
                // this.world.addComponent(attackerId, new ExecuteActionComponent({ id: 'melee_attack', target: entityId }));
            }

            // Remove the temporary flag component after processing.
            this.world.removeComponent(entityId, MovedOutOfThreatenedSquareComponent);
        }
    }

    private handleReadyActions(): void {
        const entities = this.world.view(ReadyActionComponent);

        for (const { entity: entityId, components: [readyActionComponent] } of entities) {
            // In a real implementation, we would have a sophisticated trigger system.
            // For now, we'll just assume the trigger is always met.
            console.log(`InterruptSystem: Entity ${entityId} executes readied action.`);
            readyActionComponent.action.execute(this.world, readyActionComponent.target);
            this.world.removeComponent(entityId, ReadyActionComponent);
        }
    }
}
