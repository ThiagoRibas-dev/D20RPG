import { Action, ActionType } from './action.mjs';
import { GameEvents } from '../events.mjs';
import { globalServiceLocator } from '../serviceLocator.mjs';
import { Point } from '../../utils/point.mjs';
import { EntityID, World } from '../ecs/world.mjs';

export class DipAction extends Action {
    public readonly id = 'dip';
    public readonly name = 'Dip';
    public readonly description = 'Dip one item into another.';
    public readonly cost = ActionType.Standard;

    constructor(actor: EntityID, private sourceId: string, private targetId: string) {
        super(actor);
    }

    public canExecute(world: World): boolean {
        // TODO: Add validation logic
        return true;
    }

    public async execute(world: World, target?: EntityID | Point): Promise<void> {
        globalServiceLocator.eventBus.publish(GameEvents.ACTION_DIP, {
            actor: this.actor,
            sourceId: this.sourceId,
            targetId: this.targetId,
        });
    }
}
