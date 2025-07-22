import { Action, ActionType } from './action.mjs';
import { Point } from '../../utils/point.mjs';
import { EntityID, World } from '../ecs/world.mjs';
import { ActionBudgetComponent, IdentityComponent } from '../ecs/components/index.mjs';

export abstract class OpposedCheckAction extends Action {
    public readonly cost: ActionType = ActionType.Standard;

    constructor(actor: EntityID) {
        super(actor);
        this.provokesAoO = true;
    }

    public canExecute(world: World): boolean {
        const budget = world.getComponent(this.actor, ActionBudgetComponent);
        return budget ? budget.standardActions > 0 : false;
    }

    public async execute(world: World, target?: EntityID | Point): Promise<void> {
        if (typeof target !== 'string') {
            console.error(`${this.name} action requires a valid entity target.`);
            return;
        }

        const actorIdentity = world.getComponent(this.actor, IdentityComponent);
        const targetIdentity = world.getComponent(target, IdentityComponent);
        console.log(`${actorIdentity?.name} attempts to ${this.name} ${targetIdentity?.name}.`);

        const success = await this.resolveOpposedCheck(world, this.actor, target);

        if (success) {
            console.log(`${this.name} successful!`);
            this.onSuccess(world, target);
        } else {
            console.log(`${this.name} failed.`);
            this.onFailure(world, target);
        }

        const budget = world.getComponent(this.actor, ActionBudgetComponent);
        if (budget) {
            budget.standardActions--;
        }
    }

    protected abstract resolveOpposedCheck(world: World, actor: EntityID, target: EntityID): Promise<boolean>;
    protected abstract onSuccess(world: World, target: EntityID): void;
    protected abstract onFailure(world: World, target: EntityID): void;
}
