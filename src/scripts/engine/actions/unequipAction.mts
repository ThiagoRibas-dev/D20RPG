import { EquipmentSlot } from '../components/equipmentComponent.mjs';
import { Entity } from '../entities/entity.mjs';
import { Action, ActionType } from './action.mjs';

export class UnequipAction extends Action {
    public readonly cost: ActionType = ActionType.Standard;
    private slot: EquipmentSlot;

    constructor(actor: Entity, slot: EquipmentSlot) {
        super(actor);
        this.slot = slot;
    }

    public execute(): void {
        const itemName = this.actor.equipment.slots[this.slot]?.itemData.name;
        console.log(`${this.actor.name} executes UnequipAction for item in ${this.slot}.`);
        if (itemName) {
            this.actor.equipment.unequip(this.slot);
        }
    }

}