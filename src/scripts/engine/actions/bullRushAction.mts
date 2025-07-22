import { OpposedCheckAction } from './opposedCheckAction.mjs';
import { EntityID, World } from '../ecs/world.mjs';
import { IdentityComponent, PositionComponent } from '../ecs/components/index.mjs';
import { rollD20 } from '../utils.mjs';
import { MoveIntentComponent } from '../ecs/systems/movementSystem.mjs';
import { globalServiceLocator } from '../serviceLocator.mjs';

export class BullRushAction extends OpposedCheckAction {
    public readonly id = 'bull_rush';
    public readonly name = 'Bull Rush';
    public readonly description = 'Attempt to push an opponent straight back.';

    protected async resolveOpposedCheck(world: World, actorId: EntityID, targetId: EntityID): Promise<boolean> {
        const actorStr = await globalServiceLocator.modifierManager.queryStat(actorId, 'str');
        const targetStr = await globalServiceLocator.modifierManager.queryStat(targetId, 'str');

        const actorCheck = rollD20() + actorStr;
        const targetCheck = rollD20() + targetStr;

        return actorCheck > targetCheck;
    }

    protected onSuccess(world: World, targetId: EntityID): void {
        const targetIdentity = world.getComponent(targetId, IdentityComponent);
        console.log(`${targetIdentity?.name} is pushed back!`);

        const actorPos = world.getComponent(this.actor, PositionComponent);
        const targetPos = world.getComponent(targetId, PositionComponent);

        if (actorPos && targetPos) {
            const direction = {
                x: targetPos.x - actorPos.x,
                y: targetPos.y - actorPos.y,
            };
            // A real implementation would need to calculate the distance pushed
            world.addComponent(targetId, new MoveIntentComponent(direction.x, direction.y));
        }
    }

    protected onFailure(world: World, targetId: EntityID): void {
        const actorIdentity = world.getComponent(this.actor, IdentityComponent);
        console.log(`${actorIdentity?.name} fails the bull rush and is pushed back!`);

        const actorPos = world.getComponent(this.actor, PositionComponent);
        const targetPos = world.getComponent(targetId, PositionComponent);

        if (actorPos && targetPos) {
            const direction = {
                x: actorPos.x - targetPos.x,
                y: actorPos.y - targetPos.y,
            };
            world.addComponent(this.actor, new MoveIntentComponent(direction.x, direction.y));
        }
    }
}
