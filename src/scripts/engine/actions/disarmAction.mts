import { globalServiceLocator } from '../serviceLocator.mjs';
import { OpposedCheckAction } from './opposedCheckAction.mjs';
import { EntityID, World } from '../ecs/world.mjs';
import { EquipmentComponent, IdentityComponent, ItemComponent } from '../ecs/components/index.mjs';
import { rollD20 } from '../utils.mjs';

export class DisarmAction extends OpposedCheckAction {
    public readonly id = 'disarm';
    public readonly name = 'Disarm';
    public readonly description = 'Attempt to knock an opponent\'s weapon from their hands.';

    protected async resolveOpposedCheck(world: World, actor: EntityID, target: EntityID): Promise<boolean> {
        const actorAttackBonus = await globalServiceLocator.modifierManager.queryStat(actor, 'attack');
        const targetAttackBonus = await globalServiceLocator.modifierManager.queryStat(target, 'attack');

        const actorRoll = rollD20() + actorAttackBonus;
        const targetRoll = rollD20() + targetAttackBonus;

        return actorRoll > targetRoll;
    }

    protected onSuccess(world: World, target: EntityID): void {
        const targetIdentity = world.getComponent(target, IdentityComponent);
        console.log(`${targetIdentity?.name} is disarmed!`);

        const equipment = world.getComponent(target, EquipmentComponent);
        if (equipment) {
            const weaponId = equipment.slots.get('main_hand');
            if (weaponId) {
                equipment.slots.delete('main_hand');
                const weaponIdentity = world.getComponent(weaponId, IdentityComponent);
                globalServiceLocator.eventBus.publish('entity:inventory:changed', { entity: target });
                globalServiceLocator.feedback.addMessageToLog(`${targetIdentity?.name} was disarmed of their ${weaponIdentity?.name}.`, 'orange');
            }
        }
    }

    protected onFailure(world: World, target: EntityID): void {
        // In a real implementation, the target would get a disarm attempt back.
    }
}
