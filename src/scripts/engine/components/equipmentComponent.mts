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

    public equip(itemToEquip: ItemInstance, slot: EquipmentSlot): void {
        // 1. Unequip any existing item in the slot
        if (this.slots[slot]) {
            this.unequip(slot);
        }

        // 2. TODO: Add proficiency checks here. If not proficient, return.

        // 3. Move item to slot
        this.owner.inventory.remove(itemToEquip.instanceId);
        this.slots[slot] = itemToEquip;

        // 4. Apply declarative bonuses from the item's JSON
        const itemData = itemToEquip.itemData;
        if (itemData.bonuses) {
            itemData.bonuses.forEach((bonus: any) => {
                // We tag the modifier with the item's unique ID
                const modifier: Modifier = {
                    value: bonus.value,
                    type: bonus.type || 'untyped',
                    source: itemData.name,
                    sourceId: itemToEquip.instanceId
                };
                this.owner.modifiers.add(bonus.target, modifier);
            });
        }

        // Apply specific bonuses like AC
        if (itemData.armor_bonus) {
            const modifier: Modifier = {
                value: itemData.armor_bonus,
                type: itemData.type || 'armor',
                source: itemData.name,
                sourceId: itemToEquip.instanceId
            };
            this.owner.modifiers.add('ac', modifier);
        }

        if (itemData.max_dex_bonus !== undefined) {
            const dexLimitModifier: Modifier = {
                value: itemData.max_dex_bonus,
                type: 'limit', // This is a cap, not a bonus/penalty
                source: itemData.name,
                sourceId: itemToEquip.instanceId
            };
            this.owner.modifiers.add('ac.max_dex', dexLimitModifier);
        }

        // 5. Recalculate stats and publish event
        globalServiceLocator.rulesEngine.calculateStats(this.owner);
        globalServiceLocator.eventBus.publish('entity:equipped_item', { entity: this.owner, item: itemToEquip });
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