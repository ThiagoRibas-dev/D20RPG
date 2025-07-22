import { Action, ActionType } from './action.mjs';
import { globalServiceLocator } from '../serviceLocator.mjs';
import { Point } from '../../utils/point.mjs';
import { MeleeAttackAction } from './meleeAttackAction.mjs';
import { EntityID, World } from '../ecs/world.mjs';
import { ActionBudgetComponent, EquipmentComponent, IdentityComponent, ModifiersComponent } from '../ecs/components/index.mjs';

export class ChargeAction extends Action {
    public readonly id = 'charge';
    public readonly name = 'Charge';
    public readonly description = 'Move up to double your speed and make a single attack with a +2 bonus.';
    public readonly cost: ActionType = ActionType.FullRound;

    constructor(actor: EntityID) {
        super(actor);
        this.provokesAoO = false;
    }

    public canExecute(world: World): boolean {
        // This is a simplified check. A real implementation would need to
        // validate that there is a clear path to an opponent.
        const budget = world.getComponent(this.actor, ActionBudgetComponent);
        return budget ? budget.standardActions > 0 && budget.moveActions > 0 : false;
    }

    public async execute(world: World, target?: EntityID | Point): Promise<void> {
        if (typeof target !== 'string') {
            console.error("Charge action requires a valid entity target.");
            return;
        }

        const actorIdentity = world.getComponent(this.actor, IdentityComponent);
        const targetIdentity = world.getComponent(target, IdentityComponent);
        console.log(`${actorIdentity?.name} is charging ${targetIdentity?.name}.`);

        // Apply the +2 bonus to the attack and -2 penalty to AC.
        const modifiers = world.getComponent(this.actor, ModifiersComponent);
        if (modifiers) {
            modifiers.modifiers.push({
                value: 2,
                type: 'untyped',
                target: 'attack',
                source: 'Charge Action',
                duration: 1,
                tags: []
            });
            modifiers.modifiers.push({
                value: -2,
                type: 'untyped',
                target: 'ac',
                source: 'Charge Action',
                duration: 1,
                tags: []
            });
        }

        // The movement part of the charge would be handled by the player
        // controller or AI. After the movement, a single melee attack is made.
        const equipment = world.getComponent(this.actor, EquipmentComponent);
        const weapon = equipment?.slots.get('main_hand');
        const attackAction = new MeleeAttackAction(this.actor, target, weapon);
        await attackAction.execute(world);

        const budget = world.getComponent(this.actor, ActionBudgetComponent);
        if (budget) {
            budget.standardActions = 0;
            budget.moveActions = 0;
        }
    }
}
