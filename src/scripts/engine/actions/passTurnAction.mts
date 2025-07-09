import { Entity } from '../entities/entity.mjs';
import { Action, ActionType } from './action.mjs';

/**
 * An action that does nothing. Used when an actor cannot or chooses not to act.
 * This ensures the turn flow always continues.
 */
export class PassTurnAction extends Action {
    public readonly cost: ActionType = ActionType.Standard; // Consumes the main action

    constructor(actor: Entity) {
        super(actor);
    }

    public execute(): void {
        console.log(`${this.actor.name} passes their turn.`);
        // This action intentionally does nothing. Its purpose is to be a valid
        // object that can be processed by the TurnManager to advance the turn.
    }
}