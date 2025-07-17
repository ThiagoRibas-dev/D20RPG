import { Entity } from '../entities/entity.mjs';
import { GameEvents } from '../events.mjs';
import { globalServiceLocator } from '../serviceLocator.mjs';
import { EntityPosition } from '../utils.mjs';
import { Action, ActionType } from './action.mjs';
import { Point } from '../../utils/point.mjs';

export class MoveAction extends Action {
    public readonly id = 'move';
    public readonly name = 'Move';
    public readonly description = 'Move to an adjacent square.';
    public readonly cost: ActionType = ActionType.Move;
    private direction: EntityPosition;

    constructor(actor: Entity, direction: EntityPosition) {
        super(actor);
        this.direction = direction;
        this.provokesAoO = true;
    }

    public canExecute(): boolean {
        // For now, we assume a move is always possible if the character has move points.
        // The RulesEngine will handle collision and pathfinding.
        return this.actor.actionBudget.movementPoints > 0;
    }

    public async execute(target?: Entity | Point): Promise<void> {
        console.log(`${this.actor.name} declares MoveAction.`);

        // Publish the intent. The RulesEngine will handle the rest.
        globalServiceLocator.eventBus.publish(GameEvents.ACTION_MOVE_DECLARED, {
            actor: this.actor,
            direction: this.direction
        });
    }
}
