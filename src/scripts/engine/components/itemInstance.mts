import { ContentItem } from '../entities/contentItem.mjs';

export class ItemInstance {
    public readonly instanceId: string;
    public readonly baseItemId: string; // e.g., "longsword"
    public readonly itemData: ContentItem; // The actual loaded JSON data
    public tags: string[]; // Instance-specific tags like "cursed", "identified"

    constructor(baseItemId: string, itemData: ContentItem) {
        this.instanceId = `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        this.baseItemId = baseItemId;
        this.itemData = itemData;
        this.tags = [...(itemData.tags || [])]; // Copy base tags
    }
}