import { Modifier, ModifierList } from "./entities/modifier.mjs";
import { globalServiceLocator } from "./serviceLocator.mjs";
import { EntityID } from "./ecs/world.mjs";
import { AttributesComponent, ClassComponent, ModifiersComponent } from "./ecs/components/index.mjs";
import { calculateModifier } from "./utils.mjs";

export interface StatQueryContext {
    excludedTags?: string[];
    requiredTags?: string[];
}

export class ModifierManager {
    private modifierTypes: Map<string, any>;
    private attributeDefinitions: any;

    constructor(modifierTypes: any[], attributeDefinitions: any) {
        this.modifierTypes = new Map(modifierTypes.map(type => [type.id, type]));
        this.attributeDefinitions = attributeDefinitions;
    }

    public async queryStat(
        entityId: EntityID,
        stat: string,
        context: StatQueryContext = {}
    ): Promise<number> {
        console.log(`Querying stat: ${stat} for entity ${entityId}`);
        const world = globalServiceLocator.world;
        const modifiers = world.getComponent(entityId, ModifiersComponent);
        const baseValue = await this.getBaseValue(entityId, stat);

        if (!modifiers) {
            return baseValue;
        }

        const relevantMods = modifiers.modifiers.filter(mod => {
            if (mod.target !== stat) return false;
            if (context.excludedTags?.some(tag => mod.tags.includes(tag))) return false;
            if (context.requiredTags && !context.requiredTags.every(tag => mod.tags.includes(tag))) return false;
            return true;
        });

        const list = new ModifierList(this.modifierTypes);
        for (const mod of relevantMods) {
            list.add(mod);
        }

        return baseValue + list.getTotal();
    }

    private async getBaseValue(entityId: EntityID, stat: string): Promise<number> {
        const definition = this.attributeDefinitions[stat];
        if (!definition) {
            const attributes = globalServiceLocator.world.getComponent(entityId, AttributesComponent);
            return attributes?.attributes.get(stat) || 0;
        }

        const world = globalServiceLocator.world;

        switch (definition.source) {
            case 'attribute':
                const attributes = world.getComponent(entityId, AttributesComponent);
                return attributes?.attributes.get(stat) || 0;
            case 'base':
                return definition.baseValue || 0;
            case 'derived':
                let derivedValue = 0;
                for (const dep of definition.dependencies) {
                    if (dep.formula === "(stat - 10) / 2") {
                        const sourceStatValue = await this.getBaseValue(entityId, dep.stat);
                        derivedValue += calculateModifier(sourceStatValue);
                    } else {
                        const sourceStatValue = await this.queryStat(entityId, dep.stat);
                        derivedValue += sourceStatValue;
                    }
                }
                return derivedValue;
            case 'lookup':
                const classComp = world.getComponent(entityId, ClassComponent);
                if (!classComp || classComp.classes.length === 0) {
                    return 0;
                }

                const totalLevel = classComp.classes.reduce((acc, c) => acc + c.level, 0);
                let value = 0;

                if (definition.table === 'classes' && definition.column) {
                    let totalFromProgression = 0;
                    for (const c of classComp.classes) {
                        const classData = await globalServiceLocator.contentLoader.loadClass(c.classId);
                        const progressionTable = classData.progression;
                        if (progressionTable) {
                            const levelData = progressionTable.find((p: { level: number; }) => p.level === c.level);
                            if (levelData && typeof levelData[definition.column] === 'number') {
                                totalFromProgression += levelData[definition.column];
                            }
                        }
                    }
                    value = totalFromProgression;
                }

                if (stat === 'skill_points') {
                    const intModifier = calculateModifier(await this.queryStat(entityId, 'int'));
                    let totalPoints = 0;
                    const totalLevel = classComp.classes.reduce((acc, c) => acc + c.level, 0);

                    for (const c of classComp.classes) {
                        const classData = await globalServiceLocator.contentLoader.loadClass(c.classId);
                        const classSkillPoints = classData.skill_points_per_level?.base || 0;
                        
                        let levelPoints = (classSkillPoints + intModifier);
                        if (totalLevel === 1) {
                            levelPoints *= 4;
                        }
                        totalPoints += Math.max(1, levelPoints) * c.level;
                    }
                    value = totalPoints;
                }

                return value;
            default:
                return 0;
        }
    }
}
