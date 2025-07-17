import { Entity } from '../entities/entity.mjs';
import { globalServiceLocator } from '../serviceLocator.mjs';
import { OpposedCheckAction } from './opposedCheckAction.mjs';

export class TripAction extends OpposedCheckAction {
    public readonly id = 'trip';
    public readonly name = 'Trip';
    public readonly description = 'Attempt to trip an opponent, making them prone.';

    protected async resolveOpposedCheck(actor: Entity, target: Entity): Promise<boolean> {
        return globalServiceLocator.rulesEngine.resolveTrip(actor, target);
    }

    protected onSuccess(target: Entity): void {
        target.tags.add('status:prone');
        globalServiceLocator.eventBus.publish('entity:status:changed', { entity: target });
    }

    protected onFailure(target: Entity): void {
        // In a real implementation, the target would get a trip attempt back.
        // For now, we do nothing on failure.
    }
}
