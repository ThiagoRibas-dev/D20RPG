import { globalServiceLocator } from '../serviceLocator.mjs';
import { OpposedCheckAction } from './opposedCheckAction.mjs';
import { EntityID, World } from '../ecs/world.mjs';
import { TagsComponent } from '../ecs/components/index.mjs';
import { rollD20 } from '../utils.mjs';

export class TripAction extends OpposedCheckAction {
    public readonly id = 'trip';
    public readonly name = 'Trip';
    public readonly description = 'Attempt to trip an opponent, making them prone.';

    protected async resolveOpposedCheck(world: World, actor: EntityID, target: EntityID): Promise<boolean> {
        const actorTripBonus = await globalServiceLocator.modifierManager.queryStat(actor, 'trip');
        const targetOpposeTripBonus = await globalServiceLocator.modifierManager.queryStat(target, 'oppose_trip');

        const actorRoll = rollD20() + actorTripBonus;
        const targetRoll = rollD20() + targetOpposeTripBonus;

        return actorRoll > targetRoll;
    }

    protected onSuccess(world: World, target: EntityID): void {
        const tags = world.getComponent(target, TagsComponent);
        if (tags) {
            tags.tags.add('status:prone');
        }
        globalServiceLocator.eventBus.publish('entity:status:changed', { entity: target });
    }

    protected onFailure(world: World, target: EntityID): void {
        // In a real implementation, the target would get a trip attempt back.
        // For now, we do nothing on failure.
    }
}
