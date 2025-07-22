import { Action, ActionType } from './action.mjs';
import { EntityID, World } from '../ecs/world.mjs';
import { EquipmentComponent, IdentityComponent } from '../ecs/components/index.mjs';
import { EquipmentSlot } from '../ecs/components/equipmentComponent.mjs';

export class EquipAction extends Action {
    public readonly cost: ActionType = ActionType.Standard;
    public readonly id: string = 'equip';
    public readonly name: string = 'Equip';
    public readonly description: string = 'Equip an item to a free slot.';

    private item: EntityID;
    private slot: EquipmentSlot;

    constructor(actor: EntityID, item: EntityID, slot: EquipmentSlot) {
        super(actor);
        this.item = item;
        this.slot = slot;
    }

    canExecute(world: World): boolean {
        const equipment = world.getComponent(this.actor, EquipmentComponent);
        return equipment ? !equipment.slots.has(this.slot) : false;
    }

    public async execute(world: World): Promise<void> {
        const actorIdentity = world.getComponent(this.actor, IdentityComponent);
        const itemIdentity = world.getComponent(this.item, IdentityComponent);
        console.log(`${actorIdentity?.name} executes EquipAction for ${itemIdentity?.name}.`);

        const equipment = world.getComponent(this.actor, EquipmentComponent);
        if (equipment) {
            equipment.slots.set(this.slot, this.item);
        }
        return Promise.resolve();
    }
}
