import {
    ActionBudgetComponent,
    AIComponent,
    AttributesComponent,
    ClassComponent,
    EquipmentComponent,
    FeatsComponent,
    IdentityComponent,
    InventoryComponent,
    ModifiersComponent,
    PositionComponent,
    RenderableComponent,
    SkillsComponent,
    StateComponent,
    TagsComponent,
    TemplateComponent,
} from '../ecs/components/index.mjs';
import { EntityID } from '../ecs/world.mjs';
import { globalServiceLocator } from '../serviceLocator.mjs';
import { EntityPosition, calculateModifier } from '../utils.mjs';

export class NpcFactory {
    public async create(prefabId: string, prefabType: 'monsters' | 'npcs', position: EntityPosition): Promise<EntityID | null> {
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

        const world = globalServiceLocator.world;
        const entityId = world.createEntity();

        // 1. Base Components
        world.addComponent(entityId, new IdentityComponent(prefab.name, prefabId));
        world.addComponent(entityId, new TagsComponent(prefab.tags || []));
        world.addComponent(entityId, new PositionComponent(position.x, position.y));
        const renderable = prefab.renderable || { char: prefab.ascii_char || '?', color: prefab.color || 'magenta', layer: 5 };
        world.addComponent(entityId, new RenderableComponent(renderable.char, renderable.color, renderable.layer));
        world.addComponent(entityId, new AIComponent(prefab.ai_flags || []));
        world.addComponent(entityId, new StateComponent(new Map()));
        world.addComponent(entityId, new ActionBudgetComponent());

        // 2. Attributes & Modifiers
        const attributes = new AttributesComponent(new Map(Object.entries(prefab.stats)));
        world.addComponent(entityId, attributes);
        world.addComponent(entityId, new ModifiersComponent()); // Start with empty modifiers
        world.addComponent(entityId, new FeatsComponent(prefab.feats || []));
        world.addComponent(entityId, new SkillsComponent(new Map(Object.entries(prefab.skills || {}))));
        world.addComponent(entityId, new InventoryComponent());
        world.addComponent(entityId, new TemplateComponent(null));

        // 3. Class & Race Effects
        world.addComponent(entityId, new ClassComponent(prefab.classes || []));
        
        const effectManager = globalServiceLocator.effectManager;
        await effectManager.applyRaceEffects(entityId, prefab.race);
        if (prefab.classes) {
            for (const classInstance of prefab.classes) {
                await effectManager.applyClassEffects(entityId, classInstance.id, classInstance.level);
            }
        }
        if (prefab.feats) {
            await effectManager.applyFeatEffects(entityId, prefab.feats);
        }

        // 4. Equipment
        const equipmentComponent = new EquipmentComponent();
        if (prefab.equipment) {
            const lootFactory = globalServiceLocator.lootFactory;
            for (const slot in prefab.equipment) {
                const itemDef = prefab.equipment[slot];
                if (itemDef && itemDef.base_item) {
                    // TODO: LootFactory will be refactored to return an EntityID.
                    // const itemEntityId = await lootFactory.createItem(itemDef.base_item, itemDef.properties, itemDef.material);
                    // if (itemEntityId) {
                    //     equipmentComponent.slots.set(slot as keyof typeof prefab.equipment, itemEntityId);
                    //     // TODO: EffectManager will apply modifiers from the equipped item.
                    //     // await globalServiceLocator.effectManager.applyEquipmentEffects(entityId, itemEntityId);
                    // }
                }
            }
        }
        world.addComponent(entityId, equipmentComponent);

        // 5. Final HP Calculation
        const con = await globalServiceLocator.modifierManager.queryStat(entityId, 'con');
        const conMod = calculateModifier(con);
        
        // TODO: This needs to be a proper lookup from class data.
        const totalLevel = prefab.classes ? prefab.classes.reduce((acc: number, c: { level: number }) => acc + c.level, 0) : 1;
        const hitDice = 8; // Placeholder for average hit dice
        
        const maxHp = (hitDice * totalLevel) + (conMod * totalLevel);
        attributes.attributes.set('hp_max', maxHp);
        attributes.attributes.set('hp_current', maxHp);

        console.log(`Created ECS entity ${entityId} for prefab ${prefabId}`);

        return entityId;
    }
}
