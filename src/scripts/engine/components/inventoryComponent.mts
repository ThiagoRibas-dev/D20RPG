import { EntityID } from '../ecs/world.mjs';

/**
 * A component that holds the EntityIDs of items in an entity's inventory.
 */
export class InventoryComponent {
    public items: EntityID[] = [];

    constructor(items: EntityID[] = []) {
        this.items = items;
    }

    public add(item: EntityID) {
        this.items.push(item);
    }

    public remove(item: EntityID): EntityID | undefined {
        const index = this.items.indexOf(item);
        if (index > -1) {
            return this.items.splice(index, 1)[0];
        }
        return undefined;
    }
}
