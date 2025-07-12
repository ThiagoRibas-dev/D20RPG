import { ItemInstance } from '../components/itemInstance.mjs';
import { ContentItem } from '../entities/contentItem.mjs';
import { globalServiceLocator } from '../serviceLocator.mjs';
import { deepMerge } from '../utils.mjs';

export class LootFactory {
    public async createItem(baseItemId: string, propertyIds: string[] = [], materialId?: string): Promise<ItemInstance | null> {
        const contentLoader = globalServiceLocator.contentLoader;
        const content = await contentLoader.getContent();

        // 1. Get the base item data (e.g., longsword.json)
        const baseItemData = content.items[baseItemId]?.get();
        if (!baseItemData) {
            console.error(`Base item not found: ${baseItemId}`);
            return null;
        }

        // Create a deep copy to avoid modifying the original template
        const finalItemData: ContentItem = JSON.parse(JSON.stringify(baseItemData));

        // 2. Gather all property and material data
        const propertiesToApply = [];
        for (const propId of propertyIds) {
            const propData = content.magic_properties[propId]?.get();
            if (propData) {
                propertiesToApply.push(propData);
            } else {
                console.warn(`Magic property not found: ${propId}`);
            }
        }

        if (materialId) {
            const materialData = content.materials[materialId]?.get();
            if (materialData) {
                propertiesToApply.push(materialData);
            } else {
                console.warn(`Material not found: ${materialId}`);
            }
        }

        // 3. Sequentially merge all properties onto the base item data
        for (const propData of propertiesToApply) {
            deepMerge(finalItemData, propData);
        }

        // If the item has any properties or a special material, it starts as unidentified.
        if (propertyIds.length > 0 || materialId) {
            if (!finalItemData.tags) {
                finalItemData.tags = [];
            }
            finalItemData.tags.push('state:unidentified');
        }

        // 4. Generate a procedural name
        const prefix = propertyIds.map(id => content.magic_properties[id]?.get()?.name_prefix).filter(Boolean).join(' ');
        const suffix = propertyIds.map(id => content.magic_properties[id]?.get()?.name_suffix).filter(Boolean).join(' ');
        const materialName = materialId ? content.materials[materialId]?.get()?.name_prefix : '';

        finalItemData.name = `${prefix} ${materialName} ${baseItemData.name} ${suffix}`.replace(/\s+/g, ' ').trim();


        // 5. Create the final instance
        const itemInstance = new ItemInstance(baseItemId, finalItemData);

        return itemInstance;
    }
}
