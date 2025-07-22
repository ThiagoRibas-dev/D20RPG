import { Action, ActionType } from './action.mjs';
import { EntityID, World } from '../ecs/world.mjs';
import { EquipmentComponent, IdentityComponent } from '../ecs/components/index.mjs';
import { EquipmentSlot } from '../ecs/components/equipmentComponent.mjs';

export class UnequipAction extends Action {
    public readonly cost: ActionType = ActionType.Standard;
    public readonly id: string = 'unequip';
    public readonly name: string = 'Unequip';
    public readonly description: string = 'Unequip an item, freeing the slot.';

    private slot: EquipmentSlot;

    constructor(actor: EntityID, slot: EquipmentSlot) {
        super(actor);
        this.slot = slot;
    }

    canExecute(world: World): boolean {
        const equipment = world.getComponent(this.actor, EquipmentComponent);
        return equipment ? equipment.slots.has(this.slot) : false;
    }

    public async execute(world: World): Promise<void> {
        const actorIdentity = world.getComponent(this.actor, IdentityComponent);
        console.log(`${actorIdentity?.name} executes UnequipAction for item in ${this.slot}.`);

        const equipment = world.getComponent(this.actor, EquipmentComponent);
        if (equipment) {
            equipment.slots.delete(this.slot);
        }
        return Promise.resolve();
    }
}
