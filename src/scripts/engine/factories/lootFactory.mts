import { ItemInstance } from '../components/itemInstance.mjs';
import { globalServiceLocator } from '../serviceLocator.mjs';

export class LootFactory {
    public async createItem(baseItemId: string, propertyIds: string[] = []): Promise<ItemInstance | null> {
        const contentLoader = globalServiceLocator.contentLoader;
        const content = await contentLoader.getContent();

        // 1. Get the base item data (e.g., longsword.json)
        const baseItemData = content.items[baseItemId]?.get();
        if (!baseItemData) {
            console.error(`Base item not found: ${baseItemId}`);
            return null;
        }

        // 2. Create the unique instance
        const itemInstance = new ItemInstance(baseItemId, baseItemData);

        // 3. Apply magic properties
        for (const propId of propertyIds) {
            const propData = await content.magic_properties[propId]?.get();
            if (!propData) {
                console.warn(`Magic property not found: ${propId}`);
                continue;
            }

            // Combine data. This is a simple merge; a real implementation needs deep merging.
            // Merge tags
            itemInstance.tags.push(...(propData.tags || []));

            // Merge bonuses onto the itemData for the EquipmentComponent to read
            if (propData.bonuses) {
                if (!itemInstance.itemData.bonuses) {
                    itemInstance.itemData.bonuses = [];
                }
                itemInstance.itemData.bonuses.push(...propData.bonuses);
            }
            // TODO: Merge other properties like on_hit_scripts, cost modifiers, etc.
        }

        // The name should be procedurally generated, e.g., "Flaming Longsword"
        itemInstance.itemData.name = `${propertyIds.join(' ')} ${baseItemData.name}`.trim();

        return itemInstance;
    }
}