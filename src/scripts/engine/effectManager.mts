import { EffectsComponent, FeatsComponent, ModifiersComponent } from './ecs/components/index.mjs';
import { FeatSlot } from './entities/featSlot.mjs';
import { EntityID } from './ecs/world.mjs';
import { globalServiceLocator } from './serviceLocator.mjs';
import { Modifier } from './entities/modifier.mjs';

export interface ActiveEffect {
    sourceId: string; // Unique ID of the spell or item effect that created this
    name: string;
    duration: number; // Remaining rounds. Infinity for permanent.
    modifiers: Modifier[];
}

/**
 * A stateless service for applying and removing effects to and from entities.
 * It acts as the bridge between content data and the ECS components.
 */
export class EffectManager {

    public async applyEffect(effectId: string, targetId: EntityID, sourceId: string = 'unknown', contextualTags: string[] = []): Promise<void> {
        console.log(`applyEffect : ${effectId} ${targetId} ${sourceId}`);

        if(!effectId){
            console.error(`Effect for target : ${targetId} doesn't have an ID, ignoring.`);
            return;
        }

        const effectData = await globalServiceLocator.contentLoader.loadEffect(effectId);
        if (!effectData) {
            console.error(`Could not load effect data for ID: ${effectId}`);
            return;
        }

        const world = globalServiceLocator.world;
        const effectsComponent = world.getComponent(targetId, EffectsComponent);
        const modifiersComponent = world.getComponent(targetId, ModifiersComponent);

        if (!effectsComponent || !modifiersComponent) {
            console.error(`Cannot apply effect: Entity ${targetId} is missing EffectsComponent or ModifiersComponent.`);
            return;
        }

        const newEffect: ActiveEffect = {
            sourceId: `${effectId}-${sourceId}`,
            name: effectData.name,
            duration: effectData.duration || Infinity,
            modifiers: [],
        };

        // Create modifier objects from the effect data
        if (effectData.effects) {
            for (const modData of effectData.effects) {
                if (modData.type === 'bonus') {
                    const modifier: Modifier = {
                        value: modData.value,
                        type: modData.bonus_type,
                        target: modData.target,
                        source: newEffect.name,
                        sourceId: newEffect.sourceId,
                        duration: newEffect.duration,
                        tags: modData.tags || []
                    };
                    newEffect.modifiers.push(modifier);
                    modifiersComponent.modifiers.push(modifier);
                } else if (modData.type === 'add_feat_slot') {
                    const featsComponent = world.getComponent(targetId, FeatsComponent);
                    if (featsComponent) {
                        const combinedTags = [...(modData.tags || []), ...contextualTags];
                        const newSlot = new FeatSlot(combinedTags, newEffect.sourceId);
                        featsComponent.featSlots.push(newSlot);
                    }
                }
                // TODO: Handle other effect types like 'add_tag'
            }
        }

        effectsComponent.activeEffects.push(newEffect);
        console.log(`Applied effect "${newEffect.name}" to entity ${targetId}.`);
    }

    public removeEffect(effectSourceId: string, targetId: EntityID): void {
        const world = globalServiceLocator.world;
        const effectsComponent = world.getComponent(targetId, EffectsComponent);
        const modifiersComponent = world.getComponent(targetId, ModifiersComponent);

        if (!effectsComponent || !modifiersComponent) {
            return;
        }

        // Remove the active effect
        const effectIndex = effectsComponent.activeEffects.findIndex(e => e.sourceId === effectSourceId);
        if (effectIndex > -1) {
            const effectName = effectsComponent.activeEffects[effectIndex].name;
            effectsComponent.activeEffects.splice(effectIndex, 1);
            console.log(`Removed effect "${effectName}" from entity ${targetId}.`);
        }

        // Remove all modifiers originating from that effect
        modifiersComponent.modifiers = modifiersComponent.modifiers.filter(
            m => m.sourceId !== effectSourceId
        );

        // Also remove any feat slots granted by this effect
        const featsComponent = world.getComponent(targetId, FeatsComponent);
        if (featsComponent) {
            featsComponent.featSlots = featsComponent.featSlots.filter(
                slot => slot.source !== effectSourceId
            );
        }
    }

    // Convenience methods for NpcFactory
    public async applyRaceEffects(targetId: EntityID, raceId: string) {
        const raceData = await globalServiceLocator.contentLoader.loadRace(raceId);
        if (raceData && raceData.effects) {
            for (const effect of raceData.effects) {
                await this.applyEffect(effect.id, targetId, `race:${raceId}`, effect.tags);
            }
        }
    }

    public async removeRaceEffects(targetId: EntityID, raceId: string) {
        const raceData = await globalServiceLocator.contentLoader.loadRace(raceId);
        if (raceData && raceData.effects) {
            for (const effect of raceData.effects) {
                this.removeEffect(`${effect.id}-race:${raceId}`, targetId);
            }
        }
    }
    
    public async applyClassEffects(targetId: EntityID, classId: string, level: number) {
        const classData = await globalServiceLocator.contentLoader.loadClass(classId);
        if (classData && classData.progression) {
            for (let i = 1; i <= level; i++) {
                const levelData = classData.progression.find((p: { level: number; }) => p.level === i);
                if (levelData && levelData.effects) {
                    for (const effect of levelData.effects) {
                        const uniqueSourceId = `class:${classId}:level:${i}`;
                        await this.applyEffect(effect.id, targetId, uniqueSourceId, effect.tags);
                    }
                }
            }
        }
    }

    public async removeClassEffects(targetId: EntityID, classId: string, level: number) {
        const classData = await globalServiceLocator.contentLoader.loadClass(classId);
        if (classData && classData.progression) {
            for (let i = 1; i <= level; i++) {
                const levelData = classData.progression.find((p: { level: number; }) => p.level === i);
                if (levelData && levelData.effects) {
                    for (const effect of levelData.effects) {
                        const uniqueSourceId = `class:${classId}:level:${i}`;
                        this.removeEffect(`${effect.id}-${uniqueSourceId}`, targetId);
                    }
                }
            }
        }
    }
    
    public async applyFeatEffects(targetId: EntityID, featIds: string[]) {
        for (const featId of featIds) {
            const featData = await globalServiceLocator.contentLoader.loadFeat(featId);
            if (featData && featData.effects) {
                for (const effect of featData.effects) {
                    await this.applyEffect(effect.id, targetId, `feat:${featId}`);
                }
            }
        }
    }
    public async applyEquipmentEffects(targetId: EntityID, itemId: EntityID) {
        // TODO: Load item data and apply its effects
    }

    public async applyTemplateEffects(targetId: EntityID, templateId: string | null, choices: any) {
        if (!templateId) return;
        const templateData = await globalServiceLocator.contentLoader.loadTemplate(templateId);
        if (!templateData) {
            console.error(`Could not load template data for ID: ${templateId}`);
            return;
        }

        if (templateData.effects) {
            for (const effect of templateData.effects) {
                // TODO: Handle choices
                await this.applyEffect(effect.id, targetId, `template:${templateId}`);
            }
        }
    }

    public async removeTemplateEffects(targetId: EntityID, templateId: string | null) {
        if (!templateId) return;
        const templateData = await globalServiceLocator.contentLoader.loadTemplate(templateId);
        if (!templateData) {
            console.error(`Could not load template data for ID: ${templateId}`);
            return;
        }

        if (templateData.effects) {
            for (const effect of templateData.effects) {
                this.removeEffect(`${effect.id}-template:${templateId}`, targetId);
            }
        }
    }
}
