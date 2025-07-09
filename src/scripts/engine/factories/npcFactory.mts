import { EquipmentSlot } from "../components/equipmentComponent.mjs";
import { Npc } from "../entities/npc.mjs";
import { globalServiceLocator } from "../serviceLocator.mjs";
import { EntityPosition } from "../utils.mjs";

export class NpcFactory {
    public async create(prefabId: string, prefabType: 'monsters' | 'npcs', position: EntityPosition): Promise<Npc | null> {
        const content = await globalServiceLocator.contentLoader.getContent();
        const prefab = await content.prefabs[prefabType][prefabId].get();

        if (!prefab) {
            console.error(`Could not find NPC prefab: ${prefabId}`);
            return null;
        }

        const race = await content.races[prefab.race]?.get();
        const cls = await content.classes[prefab.class]?.get();

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

        // 6. CREATE AND EQUIP ITEMS
        const lootFactory = globalServiceLocator.lootFactory;
        const equipmentList: { slot: EquipmentSlot, itemId: string }[] = [
            { slot: 'armor', itemId: prefab.armor },
            { slot: 'shield', itemId: prefab.shield },
            { slot: 'main_hand', itemId: prefab.weapon_melee },
            // Add other slots like 'off_hand', 'weapon_ranged' if they exist in prefabs
        ];

        for (const eq of equipmentList) {
            if (eq.itemId) {
                // We pass an empty array for magic properties for now.
                // The LootFactory can handle creating a simple, non-magical item instance.
                const itemInstance = await lootFactory.createItem(eq.itemId, []);
                if (itemInstance) {
                    // Equip the newly created item instance to the correct slot.
                    npc.equipment.equip(itemInstance, eq.slot);
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