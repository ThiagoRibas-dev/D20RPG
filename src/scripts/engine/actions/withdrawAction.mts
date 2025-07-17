import { Entity } from '../entities/entity.mjs';
import { Action, ActionType } from './action.mjs';
import { globalServiceLocator } from '../serviceLocator.mjs';
import { Point } from '../../utils/point.mjs';

export class WithdrawAction extends Action {
    public readonly id = 'withdraw';
    public readonly name = 'Withdraw';
    public readonly description = 'Move up to double your speed. This action doesn\'t provoke attacks of opportunity from the starting square.';
    public readonly cost: ActionType = ActionType.FullRound;

    constructor(actor: Entity) {
        super(actor);
        this.provokesAoO = false; // The action itself doesn't provoke, but the movement might.
    }

    public canExecute(): boolean {
        return this.actor.actionBudget.hasAction(ActionType.FullRound);
    }

    public async execute(target?: Entity | Point): Promise<void> {
        if (!(target instanceof Point)) {
            console.error("Withdraw action requires a destination point.");
            return;
        }

        console.log(`${this.actor.name} is withdrawing to (${target.x}, ${target.y}).`);

        // The movement itself will be handled by the player controller or AI,
        // which will call the RulesEngine.executeMove for each step.
        // We just need to set a temporary tag on the actor that the
        // RulesEngine.checkForAoO method can check.

        this.actor.tags.add('status:withdrawing');

        // In a real implementation, we would now enter a "movement" mode
        // for the player to select squares up to double their speed.
        // For now, we assume the movement to the target point is valid
        // and will be handled by other systems.

        // The 'status:withdrawing' tag should be removed at the end of the turn.
        const onTurnEnd = (event: any) => {
            if (event.data.entity.id === this.actor.id) {
                this.actor.tags.delete('status:withdrawing');
                globalServiceLocator.eventBus.unsubscribe('combat:turn:end', onTurnEnd);
            }
        };
        globalServiceLocator.eventBus.subscribe('combat:turn:end', onTurnEnd);

        this.actor.actionBudget.standard = 0; // A full-round action uses up the standard action.
        this.actor.actionBudget.move = 0; // and the move action.
    }
}
