export interface Renderable {
    char: string;
    color: string;
    backgroundColor?: string;
    layer: number; // 0=corpse, 1=floor_item, 5=creature, 10=effect
}