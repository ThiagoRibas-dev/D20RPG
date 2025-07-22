import { Action, ActionType } from './action.mjs';
import { globalServiceLocator } from '../serviceLocator.mjs';
import { Point } from '../../utils/point.mjs';
import { isPoint } from '../utils.mjs';
import { EntityID, World } from '../ecs/world.mjs';
import { ActionBudgetComponent, IdentityComponent, TagsComponent } from '../ecs/components/index.mjs';

export class WithdrawAction extends Action {
    public readonly id = 'withdraw';
    public readonly name = 'Withdraw';
    public readonly description = 'Move up to double your speed. This action doesn\'t provoke attacks of opportunity from the starting square.';
    public readonly cost: ActionType = ActionType.FullRound;

    constructor(actor: EntityID) {
        super(actor);
        this.provokesAoO = false; // The action itself doesn't provoke, but the movement might.
    }

    public canExecute(world: World): boolean {
        const budget = world.getComponent(this.actor, ActionBudgetComponent);
        return budget ? budget.standardActions > 0 && budget.moveActions > 0 : false;
    }

    public async execute(world: World, target?: EntityID | Point): Promise<void> {
        if (!isPoint(target)) {
            console.error("Withdraw action requires a destination point.");
            return;
        }

        const actorIdentity = world.getComponent(this.actor, IdentityComponent);
        console.log(`${actorIdentity?.name} is withdrawing to (${target.x}, ${target.y}).`);

        // The movement itself will be handled by the player controller or AI,
        // which will call the RulesEngine.executeMove for each step.
        // We just need to set a temporary tag on the actor that the
        // RulesEngine.checkForAoO method can check.

        const tags = world.getComponent(this.actor, TagsComponent);
        if (tags) {
            tags.tags.add('status:withdrawing');
        }

        // In a real implementation, we would now enter a "movement" mode
        // for the player to select squares up to double their speed.
        // For now, we assume the movement to the target point is valid
        // and will be handled by other systems.

        // The 'status:withdrawing' tag should be removed at the end of the turn.
        const onTurnEnd = (event: any) => {
            if (event.data.entityId === this.actor) {
                const actorTags = world.getComponent(this.actor, TagsComponent);
                if (actorTags) {
                    actorTags.tags.delete('status:withdrawing');
                }
                globalServiceLocator.eventBus.unsubscribe('combat:turn:end', onTurnEnd);
            }
        };
        globalServiceLocator.eventBus.subscribe('combat:turn:end', onTurnEnd);

        const budget = world.getComponent(this.actor, ActionBudgetComponent);
        if (budget) {
            budget.standardActions = 0;
            budget.moveActions = 0;
        }
    }
}
