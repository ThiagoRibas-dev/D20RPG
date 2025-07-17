import { Entity } from '../entities/entity.mjs';
import { Action, ActionType } from './action.mjs';
import { globalServiceLocator } from '../serviceLocator.mjs';
import { Point } from '../../utils/point.mjs';

export class TotalDefenseAction extends Action {
    public readonly id = 'total_defense';
    public readonly name = 'Total Defense';
    public readonly description = 'Gain a +4 dodge bonus to AC for 1 round, but you can\'t make attacks of opportunity.';
    public readonly cost: ActionType = ActionType.Standard;

    constructor(actor: Entity) {
        super(actor);
        this.provokesAoO = false;
    }

    public canExecute(): boolean {
        return this.actor.actionBudget.hasAction(ActionType.Standard);
    }

    public async execute(target?: Entity | Point): Promise<void> {
        console.log(`${this.actor.name} is taking the Total Defense action.`);

        // The effect manager will apply the modifier and the tag for 1 round.
        globalServiceLocator.effectManager.triggerEffect('eff_total_defense', this.actor, this.actor);

        // Deduct the action cost
        this.actor.actionBudget.standard -= 1;
    }
}
