import { Action, ActionType } from './action.mjs';
import { Point } from '../../utils/point.mjs';
import { EntityID, World } from '../ecs/world.mjs';
import { ActionBudgetComponent, IdentityComponent, ReadyActionComponent } from '../ecs/components/index.mjs';

export class ReadyAction extends Action {
    public readonly id = 'ready';
    public readonly name = 'Ready';
    public readonly description = 'Prepare to take an action later in the round.';
    public readonly cost: ActionType = ActionType.Standard;

    public trigger: string = '';
    public readiedAction: Action;
    public target?: EntityID;

    constructor(actor: EntityID, trigger: string, readiedAction: Action, target?: EntityID) {
        super(actor);
        this.provokesAoO = false;
        this.trigger = trigger;
        this.readiedAction = readiedAction;
        this.target = target;
    }

    public canExecute(world: World): boolean {
        const budget = world.getComponent(this.actor, ActionBudgetComponent);
        return budget ? budget.standardActions > 0 : false;
    }

    public async execute(world: World): Promise<void> {
        const actorIdentity = world.getComponent(this.actor, IdentityComponent);
        console.log(`${actorIdentity?.name} readies an action.`);

        world.addComponent(this.actor, new ReadyActionComponent(this.trigger, this.readiedAction, this.target));

        const budget = world.getComponent(this.actor, ActionBudgetComponent);
        if (budget) {
            budget.standardActions--;
        }
    }
}
