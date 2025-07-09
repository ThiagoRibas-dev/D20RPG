import { EquipmentSlot } from '../components/equipmentComponent.mjs';
import { ItemInstance } from '../components/itemInstance.mjs';
import { Entity } from '../entities/entity.mjs';
import { Action, ActionType } from './action.mjs';

export class EquipAction extends Action {
    public readonly cost: ActionType = ActionType.Standard; // Equipping is a standard action in combat
    private itemInstance: ItemInstance;
    private slot: EquipmentSlot;

    constructor(actor: Entity, itemInstance: ItemInstance, slot: EquipmentSlot) {
        super(actor);
        this.itemInstance = itemInstance;
        this.slot = slot;
    }

    public execute(): void {
        console.log(`${this.actor.name} executes EquipAction for ${this.itemInstance.itemData.name}.`);
        this.actor.equipment.equip(this.itemInstance, this.slot);
    }
}