/**
 * Defines the properties of an item.
 */
export class ItemComponent {
    /**
     * The type of item, e.g., 'potion', 'weapon', 'armor'.
     */
    public type: string;

    /**
     * The number of charges the item has, if applicable.
     */
    public charges: number;

    constructor(type: string, charges: number = 1) {
        this.type = type;
        this.charges = charges;
    }
}
