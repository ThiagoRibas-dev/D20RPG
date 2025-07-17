import { EquipmentSlot } from '../components/equipmentComponent.mjs';
import { ItemInstance } from '../components/itemInstance.mjs';
import { Entity } from '../entities/entity.mjs';
import { Action, ActionType } from './action.mjs';

export class EquipAction extends Action {
    public readonly cost: ActionType = ActionType.Standard;
    public readonly id: string = 'equip';
    public readonly name: string = 'Equip';
    public readonly description: string = 'Equip an item to a free slot.';

    private itemInstance: ItemInstance;
    private slot: EquipmentSlot;

    constructor(actor: Entity, itemInstance: ItemInstance, slot: EquipmentSlot) {
        super(actor);
        this.itemInstance = itemInstance;
        this.slot = slot;
    }

    canExecute(): boolean {
        // For now, we'll just check if the slot is available.
        // The equip method itself handles proficiency checks.
        return this.actor.equipment.slots[this.slot] === null;
    }

    public async execute(): Promise<void> {
        console.log(`${this.actor.name} executes EquipAction for ${this.itemInstance.itemData.name}.`);
        this.actor.equipment.equip(this.itemInstance, this.slot);
        return Promise.resolve();
    }
}
