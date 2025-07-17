// src/scripts/engine/effectManager.mts

import { ActiveEffect } from './activeEffect.mjs';
import { ItemInstance } from './components/itemInstance.mjs';
import { ContentItem } from './entities/contentItem.mjs';
import { Entity } from './entities/entity.mjs';
import { EventBus } from './eventBus.mjs';
import { GameEvents } from './events.mjs';
import { globalServiceLocator } from './serviceLocator.mjs';

/**
 * Manages the lifecycle of all temporary effects in the game.
 * It applies, ticks down, and removes effects like buffs and debuffs.
 */
export class EffectManager {
    // Stores all active effects, using their unique ID as the key.
    private activeEffects: Map<string, ActiveEffect> = new Map();

    constructor() {
        const eventBus: EventBus = globalServiceLocator.eventBus;
        // Subscribe to the end of a character's turn to tick down durations.
        eventBus.subscribe(GameEvents.COMBAT_TURN_END, (event) => this.tickDownEffectsFor(event.data.entity));
    }

    public async triggerEffect(effectId: string, actor: Entity, item?: ItemInstance) {
        const effectData = await globalServiceLocator.contentLoader.loadEffect(effectId);

        if (!effectData) {
            console.error(`Could not load effect data for ID: ${effectId}`);
            return;
        }

        console.log(`Triggering effect: ${effectData.id} for ${actor.name}`);

        for (const component of effectData.components) {
            switch (component.type) {
                case 'heal':
                    // In the future, this would call a method on the RulesEngine
                    // e.g., globalServiceLocator.rulesEngine.processHeal(actor, component, item.caster_level);
                    console.log(`Healing ${actor.name} for ${component.amount.dice}+${component.amount.bonus}`);
                    break;
                // Other cases for different effect components would go here
                default:
                    console.warn(`Unknown effect component type: ${component.type}`);
            }
        }
    }

    /**
     * Applies a new scripted effect to a target entity. This is the main entry point
     * for spells, items, or abilities that grant temporary or permanent scripted effects.
     */
    public async applyScriptedEffect(effectData: any, caster: Entity, target: Entity) {
        if (!effectData || !effectData.script || typeof effectData.script !== 'string') {
            console.error(`Effect "${effectData.name}" has no valid script property.`);
            return;
        }

        const eventBus: EventBus = globalServiceLocator.eventBus;
        try {
            const effectScriptModule = await import(effectData.script);
            const EffectLogicClass = effectScriptModule.default;
            if (!EffectLogicClass) {
                console.error(`Script at "${effectData.script}" does not have a default export.`);
                return;
            }

            const id = `effect-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

            const newEffect: ActiveEffect = {
                id,
                name: effectData.name,
                source: effectData.sourceName || 'Unknown',
                description: effectData.description || '',
                script: effectData.script,
                context: effectData.context || {},
                tags: effectData.tags || [],
                sourceEffect: effectData, // The raw effect data
                target,
                caster,
                durationInRounds: effectData.duration || 0,
                remainingRounds: effectData.duration || 0,
                scriptInstance: null,
            };

            newEffect.scriptInstance = new EffectLogicClass(newEffect, eventBus);
            this.activeEffects.set(id, newEffect);

            // If the effect grants a bonus, add it to the modifier manager
            if (effectData.type === 'bonus' && newEffect.durationInRounds > 0) {
                target.modifiers.add({
                    value: effectData.value,
                    type: effectData.bonus_type,
                    target: effectData.target,
                    source: newEffect.name,
                    sourceId: newEffect.id, // Link modifier to the active effect instance
                    duration: newEffect.durationInRounds
                });
            }

            if (newEffect.scriptInstance.onApply) {
                newEffect.scriptInstance.onApply();
            }

            eventBus.publish(GameEvents.CHARACTER_EFFECT_APPLIED, { entity: target, effect: newEffect });
            console.log(`Applied effect "${newEffect.name}" to ${target.name}.`);

        } catch (error) {
            console.error(`Failed to load or instantiate script for "${effectData.name}" from "${effectData.script}":`, error);
        }
    }

    /**
     * Removes an effect from an entity and cleans up its listeners.
     */
    public removeEffect(effectId: string) {
        const effect = this.activeEffects.get(effectId);
        if (!effect) return;

        // Remove any modifiers associated with this specific effect instance
        effect.target.modifiers.removeBySourceId(effect.id);

        // Instruct the script to perform its own cleanup.
        if (effect.scriptInstance.onRemove) {
            effect.scriptInstance.onRemove();
        }

        this.activeEffects.delete(effectId);
        globalServiceLocator.eventBus.publish(GameEvents.CHARACTER_EFFECT_REMOVED, { entity: effect.target, effect: effect });
        console.log(`Removed effect "${effect.name}" from ${effect.target.name}.`);
    }

    /**
     * The clockwork mechanism. Ticks down the duration of all effects on a given entity.
     * This is triggered by the 'combat:turn:end' event.
     */
    private tickDownEffectsFor(entity: Entity) {
        // Iterate over a copy of the values, as removeEffect can modify the map during iteration.
        for (const effect of [...this.activeEffects.values()]) {
            if (effect.target.id === entity.id) { // Assuming entities have a unique 'id' property
                if (effect.durationInRounds > 0) { // Don't tick down permanent effects
                    effect.remainingRounds--;

                    if (effect.remainingRounds <= 0) {
                        this.removeEffect(effect.id);
                    }
                }
            }
        }
    }
}
