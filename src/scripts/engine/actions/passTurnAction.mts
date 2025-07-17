import { Entity } from '../entities/entity.mjs';
import { Action, ActionType } from './action.mjs';

/**
 * An action that does nothing. Used when an actor cannot or chooses not to act.
 * This ensures the turn flow always continues.
 */
export class PassTurnAction extends Action {
    public readonly cost: ActionType = ActionType.Standard;
    public readonly id: string = 'pass';
    public readonly name: string = 'Pass Turn';
    public readonly description: string = 'Do nothing and end your turn.';

    constructor(actor: Entity) {
        super(actor);
    }

    canExecute(): boolean {
        return true;
    }

    public async execute(): Promise<void> {
        console.log(`${this.actor.name} passes their turn.`);
        // This action intentionally does nothing. Its purpose is to be a valid
        // object that can be processed by the TurnManager to advance the turn.
        return Promise.resolve();
    }
}
