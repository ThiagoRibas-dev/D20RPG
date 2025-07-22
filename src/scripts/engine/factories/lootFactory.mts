import { globalServiceLocator } from '../serviceLocator.mjs';
import { deepMerge } from '../utils.mjs';
import { EntityID } from '../ecs/world.mjs';
import { IdentityComponent, ItemComponent } from '../ecs/components/index.mjs';
import { ContentItem } from '../entities/contentItem.mjs';

export class LootFactory {
    public async createItem(baseItemId: string, propertyIds: string[] = [], materialId?: string): Promise<EntityID | null> {
        const contentLoader = globalServiceLocator.contentLoader;
        const content = await contentLoader.getContent();

        // 1. Get the base item data (e.g., longsword.json)
        const baseItemData = await content.items[baseItemId]?.get();
        if (!baseItemData) {
            console.error(`Base item not found: ${baseItemId}`);
            return null;
        }

        // Create a deep copy to avoid modifying the original template
        const finalItemData: ContentItem = JSON.parse(JSON.stringify(baseItemData));

        // 2. Gather all property and material data
        const propertiesToApply = [];
        for (const propId of propertyIds) {
            const propData = await content.magic_properties[propId]?.get();
            if (propData) {
                propertiesToApply.push(propData);
            } else {
                console.warn(`Magic property not found: ${propId}`);
            }
        }

        if (materialId) {
            const materialData = await content.materials[materialId]?.get();
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
        const prefix = (await Promise.all(propertyIds.map(id => content.magic_properties[id]?.get()?.name_prefix))).filter(Boolean).join(' ');
        const suffix = (await Promise.all(propertyIds.map(id => content.magic_properties[id]?.get()?.name_suffix))).filter(Boolean).join(' ');
        const materialName = materialId ? (await content.materials[materialId]?.get())?.name_prefix : '';

        finalItemData.name = `${prefix} ${materialName} ${baseItemData.name} ${suffix}`.replace(/\s+/g, ' ').trim();

        // 5. Create the final entity
        const world = globalServiceLocator.world;
        const entityId = world.createEntity();
        world.addComponent(entityId, new IdentityComponent(finalItemData.name, finalItemData.description));
        world.addComponent(entityId, new ItemComponent(finalItemData.type, finalItemData.charges));
        
        return entityId;
    }
}
