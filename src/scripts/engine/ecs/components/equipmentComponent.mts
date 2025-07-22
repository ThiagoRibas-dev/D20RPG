import { EntityID } from '../world.mjs';

export type EquipmentSlot = 'main_hand' | 'off_hand' | 'body' | 'head' | 'ring_1' | 'ring_2';

/**
 * A component that holds the equipped items for an entity.
 * The keys are the slot names, and the values are the EntityIDs of the equipped items.
 */
export class EquipmentComponent {
    public slots: Map<EquipmentSlot, EntityID> = new Map();

    public getEquippedWeapon(): EntityID | null {
        return this.slots.get('main_hand') || null;
    }
}
