import { EquipmentSlot } from "../components/equipmentComponent.mjs";
import { ContentItem } from "../entities/contentItem.mjs";
import { Npc } from "../entities/npc.mjs";
import { globalServiceLocator } from "../serviceLocator.mjs";
import { EntityPosition } from "../utils.mjs";

export class NpcFactory {
    public async create(prefabId: string, prefabType: 'monsters' | 'npcs', position: EntityPosition): Promise<Npc | null> {
        const content = await globalServiceLocator.contentLoader.getContent();
        if (!content) {
            console.error(`Could not access content loader`);
            return null;
        }
        
        const prefab = await content.prefabs[prefabType][prefabId].get();
        if (!prefab) {
            console.error(`Could not find NPC prefab: ${prefabId}`);
            return null;
        }

        const race: ContentItem = await content.races[prefab.race]?.get();
        const cls: ContentItem = await content.classes[prefab.class]?.get();

        // 1. Create the basic NPC instance
        const npc: Npc = new Npc(prefab.name, prefabId, race, position);
        npc.position = position;
        npc.disposition = prefab.disposition || 'neutral';

        // 2. Add class and level
        npc.classes.push({
            class: cls, level: prefab.level,
            classSkills: [],
            hitDice: 1,
        });
        npc.totalLevel = prefab.level;

        // 3. Set base stats
        npc.stats = prefab.stats;

        console.log('NpcFactory prefab', prefab);
        console.log('NpcFactory npc', npc);

        // 4. Calculate final stats using the RulesEngine
        globalServiceLocator.rulesEngine.calculateStats(npc);

        // 5. Apply feats (both declarative and scripted)
        for (const featId of prefab.feats) {
            const featData = await content.feats[featId]?.get();
            if (featData.script) {
                await globalServiceLocator.effectManager.applyEffect(content.feats[featId], npc, npc);
            }
        }
        // Recalculate stats AFTER applying feats to include declarative feat bonuses
        globalServiceLocator.rulesEngine.calculateStats(npc);

        // 6. CREATE AND EQUIP ITEMS from the new `equipment` prefab format
        if (prefab.equipment) {
            const lootFactory = globalServiceLocator.lootFactory;
            for (const slot in prefab.equipment) {
                const itemDef = prefab.equipment[slot];
                if (itemDef && itemDef.base_item) {
                    const itemInstance = await lootFactory.createItem(
                        itemDef.base_item,
                        itemDef.properties || [],
                        itemDef.material
                    );

                    if (itemInstance) {
                        npc.equipment.equip(itemInstance, slot as EquipmentSlot);
                    }
                }
            }
        }

        // 7. RE-CALCULATE STATS *AFTER* EQUIPPING
        // This is crucial to apply bonuses from the new gear.
        globalServiceLocator.rulesEngine.calculateStats(npc);

        // 8. Set renderable from prefab data
        if (prefab.renderable) {
            npc.renderable = prefab.renderable;
        } else { // Fallback for older monster prefabs
            npc.renderable = { char: prefab.ascii_char || '?', color: prefab.color || 'magenta', layer: 5 };
        }

        // 7. Instantiate AI package
        if (prefab.ai_package) {
            const aiModule = await import(prefab.ai_package);
            npc.aiPackage = new aiModule.default(npc);
        }

        return npc;
    }
}
