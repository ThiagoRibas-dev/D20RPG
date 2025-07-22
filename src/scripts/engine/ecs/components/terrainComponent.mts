/**
 * Defines the properties of a map tile.
 */
export class TerrainComponent {
    /**
     * The type of terrain, e.g., 'stone_floor', 'grass', 'water'.
     */
    public type: string;

    /**
     * The cost to move into this tile.
     */
    public movementCost: number;

    /**
     * A set of tags describing the terrain's properties, e.g., 'uneven', 'wet'.
     */
    public tags: Set<string>;

    constructor(type: string, movementCost: number = 1, tags: string[] = []) {
        this.type = type;
        this.movementCost = movementCost;
        this.tags = new Set(tags);
    }
}
