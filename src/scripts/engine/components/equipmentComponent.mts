import { Entity } from "../entities/entity.mjs";
import { Modifier } from "../entities/modifier.mjs";
import { globalServiceLocator } from "../serviceLocator.mjs";
import { ItemInstance } from "./itemInstance.mjs";

export type EquipmentSlot = 'main_hand' | 'off_hand' | 'armor' | 'shield' | 'ring_1' | 'ring_2';

export class EquipmentComponent {
    public slots: Record<EquipmentSlot, ItemInstance | null> = {
        main_hand: null, off_hand: null, armor: null, shield: null,
        ring_1: null, ring_2: null,
    };
    public readonly owner: Entity;

    constructor(owner: Entity) {
        this.owner = owner;
    }

    public equip(itemToEquip: ItemInstance, slot: EquipmentSlot): boolean {
        const itemData = itemToEquip.itemData;

        // 1. Check for proficiencies.
        const requiredProficiencies = itemData.tags.filter((t: string) => t.startsWith('requires:proficient:'));
        for (const req of requiredProficiencies) {
            const proficiency = req.replace('requires:', '');
            if (!this.owner.tags.has(proficiency)) {
                globalServiceLocator.feedback.addMessageToLog(`${this.owner.name} is not proficient with ${itemData.name}.`, 'yellow');
                return false; // Failed to equip
            }
        }

        // 2. Unequip any existing item in the target slot.
        if (this.slots[slot]) {
            this.unequip(slot);
        }

        // 3. Move item from inventory to the equipment slot.
        this.owner.inventory.remove(itemToEquip.instanceId);
        this.slots[slot] = itemToEquip;

        // 4. Apply all declarative bonuses from the item's data.
        if (itemData.bonuses) {
            itemData.bonuses.forEach((bonus: any) => {
                const modifier: Modifier = {
                    value: bonus.value,
                    type: bonus.type || 'untyped',
                    target: bonus.target,
                    source: itemData.name,
                    sourceId: itemToEquip.instanceId
                };
                this.owner.modifiers.add(bonus.target, modifier);
            });
        }

        // 5. Recalculate stats and publish the event.
        globalServiceLocator.rulesEngine.calculateStats(this.owner);
        globalServiceLocator.eventBus.publish('entity:equipped_item', { entity: this.owner, item: itemToEquip });

        return true; // Successfully equipped
    }

    public unequip(slot: EquipmentSlot): void {
        const itemToUnequip = this.slots[slot];
        if (!itemToUnequip) return;

        // 1. Remove all modifiers originating from this specific item instance
        this.owner.modifiers.removeBySourceId(itemToUnequip.instanceId);

        // 2. Move item back to inventory
        this.slots[slot] = null;
        this.owner.inventory.add(itemToUnequip);

        // 3. Recalculate stats and publish
        globalServiceLocator.rulesEngine.calculateStats(this.owner);
        globalServiceLocator.eventBus.publish('entity:unequipped_item', { entity: this.owner, item: itemToUnequip });
    }
}
