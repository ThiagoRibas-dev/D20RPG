import { Action, ActionType } from './action.mjs';
import { globalServiceLocator } from '../serviceLocator.mjs';
import { Point } from '../../utils/point.mjs';
import { EntityID, World } from '../ecs/world.mjs';
import { ActionBudgetComponent, IdentityComponent } from '../ecs/components/index.mjs';

export class TotalDefenseAction extends Action {
    public readonly id = 'total_defense';
    public readonly name = 'Total Defense';
    public readonly description = 'Gain a +4 dodge bonus to AC for 1 round, but you can\'t make attacks of opportunity.';
    public readonly cost: ActionType = ActionType.Standard;

    constructor(actor: EntityID) {
        super(actor);
        this.provokesAoO = false;
    }

    public canExecute(world: World): boolean {
        const budget = world.getComponent(this.actor, ActionBudgetComponent);
        return budget ? budget.standardActions > 0 : false;
    }

    public async execute(world: World, target?: EntityID | Point): Promise<void> {
        const actorIdentity = world.getComponent(this.actor, IdentityComponent);
        console.log(`${actorIdentity?.name} is taking the Total Defense action.`);

        // The effect manager will apply the modifier and the tag for 1 round.
        await globalServiceLocator.effectManager.applyEffect('eff_total_defense', this.actor, this.actor.toString());

        // Deduct the action cost
        const budget = world.getComponent(this.actor, ActionBudgetComponent);
        if (budget) {
            budget.standardActions--;
        }
    }
}
