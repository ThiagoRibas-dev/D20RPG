import { EntityID } from '../world.mjs';

export class InventoryComponent {
    constructor(public items: EntityID[] = []) {}
}
