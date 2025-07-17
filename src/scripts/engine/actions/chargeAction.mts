import { Entity } from '../entities/entity.mjs';
import { Action, ActionType } from './action.mjs';
import { globalServiceLocator } from '../serviceLocator.mjs';
import { Point } from '../../utils/point.mjs';
import { MeleeAttackAction } from './meleeAttackAction.mjs';

export class ChargeAction extends Action {
    public readonly id = 'charge';
    public readonly name = 'Charge';
    public readonly description = 'Move up to double your speed and make a single attack with a +2 bonus.';
    public readonly cost: ActionType = ActionType.FullRound;

    constructor(actor: Entity) {
        super(actor);
        this.provokesAoO = false;
    }

    public canExecute(): boolean {
        // This is a simplified check. A real implementation would need to
        // validate that there is a clear path to an opponent.
        return this.actor.actionBudget.hasAction(ActionType.FullRound);
    }

    public async execute(target?: Entity | Point): Promise<void> {
        if (!(target instanceof Entity)) {
            console.error("Charge action requires a valid entity target.");
            return;
        }

        console.log(`${this.actor.name} is charging ${target.name}.`);

        // Apply the +2 bonus to the attack and -2 penalty to AC.
        this.actor.modifiers.add({
            value: 2,
            type: 'untyped',
            target: 'attack',
            source: 'Charge Action',
            duration: 1
        });
        this.actor.modifiers.add({
            value: -2,
            type: 'untyped',
            target: 'ac',
            source: 'Charge Action',
            duration: 1
        });

        // The movement part of the charge would be handled by the player
        // controller or AI. After the movement, a single melee attack is made.
        const weapon = this.actor.getEquippedWeapon();
        const attackAction = new MeleeAttackAction(this.actor, target, weapon);
        await attackAction.execute();

        this.actor.actionBudget.standard = 0;
        this.actor.actionBudget.move = 0;
    }
}
