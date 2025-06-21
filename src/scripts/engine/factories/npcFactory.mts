import { Npc } from "../entities/npc.mjs";
import { ServiceLocator } from "../serviceLocator.mjs";
import { EntityPosition } from "../utils.mjs";

export class NpcFactory {
    public async create(prefabId: string, prefabType: 'monster' | 'npc', position: EntityPosition): Promise<Npc | null> {
        const content = await ServiceLocator.ContentLoader.getContent();
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

        // 4. Calculate final stats using the RulesEngine
        ServiceLocator.RulesEngine.calculateStats(npc);

        // 5. Apply feats (both declarative and scripted)
        for (const featId of prefab.feats) {
            const featData = await content.feats[featId]?.get();
            if (featData.script) {
                await ServiceLocator.EffectManager.applyEffect(content.feats[featId], npc, npc);
            }
        }
        // Recalculate stats AFTER applying feats to include declarative feat bonuses
        ServiceLocator.RulesEngine.calculateStats(npc);


        // 6. Set renderable from prefab data
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