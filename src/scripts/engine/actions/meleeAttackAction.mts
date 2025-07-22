import { GameEvents } from '../events.mjs';
import { globalServiceLocator } from '../serviceLocator.mjs';
import { Action, ActionType } from './action.mjs';
import { Point } from '../../utils/point.mjs';
import { EntityID, World } from '../ecs/world.mjs';
import { ActionBudgetComponent, IdentityComponent } from '../ecs/components/index.mjs';

export class MeleeAttackAction extends Action {
    public readonly id = 'melee_attack';
    public readonly name = 'Melee Attack';
    public readonly description = 'Make a melee attack against an adjacent opponent.';
    public readonly cost: ActionType = ActionType.Standard;
    public target: EntityID;
    private weapon: EntityID | undefined;

    constructor(actor: EntityID, target: EntityID, weapon: EntityID | undefined) {
        super(actor);
        this.target = target;
        this.weapon = weapon;
    }

    public canExecute(world: World): boolean {
        // A melee attack is always possible if the actor has a standard action.
        // The UI should be responsible for ensuring the target is in range.
        const budget = world.getComponent(this.actor, ActionBudgetComponent);
        return budget ? budget.standardActions > 0 : false;
    }

    public async execute(world: World, target?: EntityID | Point): Promise<void> {
        const finalTarget = typeof target === 'string' ? target : this.target;
        if (typeof finalTarget !== 'string') {
            console.error("Melee attack requires a valid entity target.");
            return;
        }

        const actorIdentity = world.getComponent(this.actor, IdentityComponent);
        const targetIdentity = world.getComponent(finalTarget, IdentityComponent);
        console.log(`${actorIdentity?.name} executes MeleeAttackAction on ${targetIdentity?.name}`);
        
        // This is where the event chain begins.
        globalServiceLocator.eventBus.publish(GameEvents.ACTION_ATTACK_DECLARED, {
            attacker: this.actor,
            target: finalTarget,
            weapon: this.weapon
        });
    }
}
