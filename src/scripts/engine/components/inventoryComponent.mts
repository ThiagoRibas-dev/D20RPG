import { Entity } from '../entities/entity.mjs';
import { ItemInstance } from './itemInstance.mjs';

export class InventoryComponent {
    public items: ItemInstance[] = [];
    public readonly owner: Entity;

    constructor(owner: Entity) {
        this.owner = owner;
    }

    public add(item: ItemInstance) {
        this.items.push(item);
    }

    public remove(instanceId: string): ItemInstance | undefined {
        const index = this.items.findIndex(i => i.instanceId === instanceId);
        if (index > -1) {
            return this.items.splice(index, 1)[0];
        }
        return undefined;
    }
}