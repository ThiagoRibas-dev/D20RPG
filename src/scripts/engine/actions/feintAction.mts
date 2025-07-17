import { Entity } from '../entities/entity.mjs';
import { Action, ActionType } from './action.mjs';
import { globalServiceLocator } from '../serviceLocator.mjs';
import { Point } from '../../utils/point.mjs';

export class FeintAction extends Action {
    public readonly id = 'feint';
    public readonly name = 'Feint';
    public readonly description = 'Make a Bluff check to make your opponent lose their Dexterity bonus to AC against your next attack.';
    public readonly cost: ActionType = ActionType.Standard;

    constructor(actor: Entity) {
        super(actor);
        this.provokesAoO = false;
    }

    public canExecute(): boolean {
        return this.actor.actionBudget.hasAction(ActionType.Standard);
    }

    public async execute(target?: Entity | Point): Promise<void> {
        if (!(target instanceof Entity)) {
            console.error("Feint action requires a valid entity target.");
            return;
        }

        console.log(`${this.actor.name} attempts to feint ${target.name}.`);

        const success = await globalServiceLocator.rulesEngine.resolveFeint(this.actor, target);

        if (success) {
            console.log("Feint successful!");
            globalServiceLocator.effectManager.triggerEffect(
                'eff_feinted', // This effect will need to be created
                this.actor,
                target
            );
        } else {
            console.log("Feint failed.");
        }

        this.actor.actionBudget.standard -= 1;
    }
}
