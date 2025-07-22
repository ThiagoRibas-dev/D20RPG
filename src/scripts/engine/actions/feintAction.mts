import { Action, ActionType } from './action.mjs';
import { globalServiceLocator } from '../serviceLocator.mjs';
import { Point } from '../../utils/point.mjs';
import { EntityID, World } from '../ecs/world.mjs';
import { ActionBudgetComponent, IdentityComponent } from '../ecs/components/index.mjs';
import { rollD20 } from '../utils.mjs';

export class FeintAction extends Action {
    public readonly id = 'feint';
    public readonly name = 'Feint';
    public readonly description = 'Make a Bluff check to make your opponent lose their Dexterity bonus to AC against your next attack.';
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
        if (typeof target !== 'string') {
            console.error("Feint action requires a valid entity target.");
            return;
        }

        const actorIdentity = world.getComponent(this.actor, IdentityComponent);
        const targetIdentity = world.getComponent(target, IdentityComponent);
        console.log(`${actorIdentity?.name} attempts to feint ${targetIdentity?.name}.`);

        const success = await this.resolveFeint(world, this.actor, target);

        if (success) {
            console.log("Feint successful!");
            await globalServiceLocator.effectManager.applyEffect(
                'eff_feinted', // This effect will need to be created
                target,
                this.actor.toString()
            );
        } else {
            console.log("Feint failed.");
        }

        const budget = world.getComponent(this.actor, ActionBudgetComponent);
        if (budget) {
            budget.standardActions--;
        }
    }

    private async resolveFeint(world: World, actor: EntityID, target: EntityID): Promise<boolean> {
        const actorBluff = await globalServiceLocator.modifierManager.queryStat(actor, 'bluff');
        const targetSenseMotive = await globalServiceLocator.modifierManager.queryStat(target, 'sense_motive');

        const actorRoll = rollD20() + actorBluff;
        const targetRoll = rollD20() + targetSenseMotive;

        return actorRoll > targetRoll;
    }
}
