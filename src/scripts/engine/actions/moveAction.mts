import { Entity } from '../entities/entity.mjs';
import { MapTile } from '../entities/mapTile.mjs';
import { globalServiceLocator } from '../serviceLocator.mjs';
import { EntityPosition } from '../utils.mjs';
import { Action, ActionType } from './action.mjs';

export class MoveAction extends Action {
    public readonly cost: ActionType = ActionType.Move;
    private direction: EntityPosition;

    constructor(actor: Entity, direction: EntityPosition) {
        super(actor);
        this.direction = direction;
    }

    public execute(): void {
        console.log(`${this.actor.name} declares MoveAction.`);

        // Publish the intent. The RulesEngine will handle the rest.
        globalServiceLocator.eventBus.publish('action:move:declared', {
            actor: this.actor,
            direction: this.direction
        });
    }
}