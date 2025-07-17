import { Entity } from '../entities/entity.mjs';
import { globalServiceLocator } from '../serviceLocator.mjs';
import { OpposedCheckAction } from './opposedCheckAction.mjs';

export class DisarmAction extends OpposedCheckAction {
    public readonly id = 'disarm';
    public readonly name = 'Disarm';
    public readonly description = 'Attempt to knock an opponent\'s weapon from their hands.';

    protected async resolveOpposedCheck(actor: Entity, target: Entity): Promise<boolean> {
        return globalServiceLocator.rulesEngine.resolveDisarm(actor, target);
    }

    protected onSuccess(target: Entity): void {
        // A real implementation would move the item from the target's equipment to the ground.
        console.log(`${target.name} is disarmed!`);
        const weapon = target.getEquippedWeapon();
        if (weapon && weapon.id !== 'unarmed') {
            target.equipment.unequip('main_hand');
            globalServiceLocator.eventBus.publish('entity:inventory:changed', { entity: target });
            globalServiceLocator.feedback.addMessageToLog(`${target.name} was disarmed of their ${weapon.name}.`, 'orange');
        }
    }

    protected onFailure(target: Entity): void {
        // In a real implementation, the target would get a disarm attempt back.
    }
}
