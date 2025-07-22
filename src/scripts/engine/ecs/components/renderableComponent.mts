/**
 * Defines the visual representation of an entity.
 */
export class RenderableComponent {
    /**
     * The character or symbol to draw.
     */
    public char: string;

    /**
     * The color of the character.
     */
    public color: string;

    /**
     * The rendering layer, used for Z-ordering. Higher numbers are drawn on top.
     */
    public layer: number;

    constructor(char: string, color: string, layer: number = 5) {
        this.char = char;
        this.color = color;
        this.layer = layer;
    }
}
