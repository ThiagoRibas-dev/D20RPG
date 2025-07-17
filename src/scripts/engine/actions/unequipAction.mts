import { EquipmentSlot } from '../components/equipmentComponent.mjs';
import { Entity } from '../entities/entity.mjs';
import { Action, ActionType } from './action.mjs';

export class UnequipAction extends Action {
    public readonly cost: ActionType = ActionType.Standard;
    public readonly id: string = 'unequip';
    public readonly name: string = 'Unequip';
    public readonly description: string = 'Unequip an item, freeing the slot.';

    private slot: EquipmentSlot;

    constructor(actor: Entity, slot: EquipmentSlot) {
        super(actor);
        this.slot = slot;
    }

    canExecute(): boolean {
        return this.actor.equipment.slots[this.slot] !== null;
    }

    public async execute(): Promise<void> {
        const itemName = this.actor.equipment.slots[this.slot]?.itemData.name;
        console.log(`${this.actor.name} executes UnequipAction for item in ${this.slot}.`);
        if (itemName) {
            this.actor.equipment.unequip(this.slot);
        }
        return Promise.resolve();
    }
}
