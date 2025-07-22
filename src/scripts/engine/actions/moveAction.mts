import { GameEvents } from '../events.mjs';
import { globalServiceLocator } from '../serviceLocator.mjs';
import { EntityPosition } from '../utils.mjs';
import { Action, ActionType } from './action.mjs';
import { Point } from '../../utils/point.mjs';
import { EntityID, World } from '../ecs/world.mjs';
import { ActionBudgetComponent, IdentityComponent } from '../ecs/components/index.mjs';
import { MoveIntentComponent } from '../ecs/systems/movementSystem.mjs';

export class MoveAction extends Action {
    public readonly id = 'move';
    public readonly name = 'Move';
    public readonly description = 'Move to an adjacent square.';
    public readonly cost: ActionType = ActionType.Move;
    private direction: EntityPosition;

    constructor(actor: EntityID, direction: EntityPosition) {
        super(actor);
        this.direction = direction;
        this.provokesAoO = true;
    }

    public canExecute(world: World): boolean {
        const budget = world.getComponent(this.actor, ActionBudgetComponent);
        return budget ? budget.moveActions > 0 : false;
    }

    public async execute(world: World, target?: EntityID | Point): Promise<void> {
        const actorIdentity = world.getComponent(this.actor, IdentityComponent);
        console.log(`${actorIdentity?.name} declares MoveAction.`);

        world.addComponent(this.actor, new MoveIntentComponent(this.direction.x, this.direction.y));
        
        const budget = world.getComponent(this.actor, ActionBudgetComponent);
        if (budget) {
            budget.moveActions--;
        }
    }
}
