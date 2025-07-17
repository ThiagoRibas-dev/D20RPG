import { Entity } from '../entities/entity.mjs';
import { globalServiceLocator } from '../serviceLocator.mjs';
import { OpposedCheckAction } from './opposedCheckAction.mjs';

export class BullRushAction extends OpposedCheckAction {
    public readonly id = 'bull_rush';
    public readonly name = 'Bull Rush';
    public readonly description = 'Attempt to push an opponent straight back.';

    protected async resolveOpposedCheck(actor: Entity, target: Entity): Promise<boolean> {
        return globalServiceLocator.rulesEngine.resolveBullRush(actor, target);
    }

    protected onSuccess(target: Entity): void {
        // A real implementation would need to calculate the distance pushed
        // and move the target entity accordingly.
        console.log(`${target.name} is pushed back!`);
        const direction = {
            x: target.position.x - this.actor.position.x,
            y: target.position.y - this.actor.position.y,
        };
        // This is a simplified move. A real implementation would need to
        // check for collisions and other obstacles.
        globalServiceLocator.rulesEngine.executeMove(target, direction);
    }

    protected onFailure(target: Entity): void {
        // The actor is pushed back 5 feet.
        const direction = {
            x: this.actor.position.x - target.position.x,
            y: this.actor.position.y - target.position.y,
        };
        globalServiceLocator.rulesEngine.executeMove(this.actor, direction);
    }
}
