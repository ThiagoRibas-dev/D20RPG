import { globalServiceLocator } from './serviceLocator.mjs';
import { Point } from '../utils/point.mjs';
import { GameEvent, GameEvents } from './events.mjs';
import { EntityID } from './ecs/world.mjs';
import { TagsComponent, InventoryComponent, IdentityComponent, PositionComponent } from './ecs/components/index.mjs';

// Define interfaces for the data-driven interaction rules
interface InteractionCondition {
    spell_tags?: string[];
    target_tile_tags?: string[];
    source_tags?: string[];
    target_tags?: string[];
}

interface InteractionEffect {
    action: 'add_tile_state' | 'remove_tile_state' | 'apply_effect_to_target' | 'consume_source';
    tag?: string;
    duration?: string; // e.g., "1d4" or a number
    effect_id?: string;
    source_becomes?: string;
}

interface InteractionRule {
    interaction_type: 'ENVIRONMENT' | 'DIP';
    trigger_event?: string;
    conditions: InteractionCondition;
    effects: InteractionEffect[];
}

export class InteractionManager {
    private interactionRules: InteractionRule[] = [];

    constructor() {
        this.loadRules();
        this.subscribeToEvents();
    }

    private loadRules() {
        this.interactionRules = globalServiceLocator.contentLoader.interactionRules;
    }

    private subscribeToEvents() {
        // Subscribe to any events that can trigger interactions
        globalServiceLocator.eventBus.subscribe(GameEvents.ACTION_USE_POWER_DECLARED, this.handleUsePower.bind(this));
        globalServiceLocator.eventBus.subscribe(GameEvents.ACTION_DIP, this.handleDipAction.bind(this));
    }

    private handleUsePower(event: GameEvent) {
        const { powerId, target, actor } = event.data;
        // TODO: Get power tags from content
        const powerTags: string[] = [];
        
        const tileData = globalServiceLocator.state.currentMapData.getTileAt(target.x, target.y);
        const staticTileTags = tileData ? tileData.tags : [];
        const dynamicTileTags = globalServiceLocator.tileStateManager.getTagsAt(target);
        const allTileTags = [...staticTileTags, ...dynamicTileTags];

        for (const rule of this.interactionRules) {
            if (rule.trigger_event === GameEvents.ACTION_USE_POWER_DECLARED) {
                const conditionsMet = this.checkConditions(rule.conditions, powerTags, allTileTags);
                if (conditionsMet) {
                    this.applyEffects(rule.effects, target, actor, target);
                }
            }
        }
    }

    private checkConditions(conditions: InteractionCondition, spellTags: string[], tileTags: string[], sourceTags?: string[], targetTags?: string[]): boolean {
        if (conditions.spell_tags && !conditions.spell_tags.every(tag => spellTags.includes(tag))) {
            return false;
        }
        if (conditions.target_tile_tags && !conditions.target_tile_tags.every(tag => tileTags.includes(tag))) {
            return false;
        }
        if (conditions.source_tags && sourceTags && !conditions.source_tags.every(tag => sourceTags.includes(tag))) {
            return false;
        }
        if (conditions.target_tags && targetTags && !conditions.target_tags.every(tag => targetTags.includes(tag))) {
            return false;
        }
        return true;
    }

    private applyEffects(effects: InteractionEffect[], position: Point, sourceId?: EntityID, targetId?: EntityID) {
        for (const effect of effects) {
            const duration = effect.duration ? this.parseDuration(effect.duration) : -1;
            if (effect.action === 'add_tile_state' && effect.tag) {
                globalServiceLocator.tileStateManager.addState(position, effect.tag, duration);
            } else if (effect.action === 'remove_tile_state' && effect.tag) {
                globalServiceLocator.tileStateManager.removeState(position, effect.tag);
            } else if (effect.action === 'apply_effect_to_target' && effect.effect_id && targetId) {
                globalServiceLocator.effectManager.applyEffect(effect.effect_id, targetId, sourceId ? `entity:${sourceId}`: 'unknown');
            } else if (effect.action === 'consume_source' && sourceId) {
                // TODO: Implement item consumption
            }
        }
    }

    private parseDuration(durationStr: string): number {
        // Simple dice roll parser, e.g., "1d4" or "2d6+2"
        // For now, let's just handle a simple number or -1 for infinite
        const duration = parseInt(durationStr, 10);
        return isNaN(duration) ? -1 : duration;
    }

    public async handleDipAction(event: GameEvent) {
        const { actor, sourceId, targetId } = event.data;
        const world = globalServiceLocator.world;

        const sourceTagsComp = world.getComponent(sourceId, TagsComponent);
        const targetTagsComp = world.getComponent(targetId, TagsComponent);
        const actorPosComp = world.getComponent(actor, PositionComponent);
        const actorIdentityComp = world.getComponent(actor, IdentityComponent);
        const sourceIdentityComp = world.getComponent(sourceId, IdentityComponent);
        const targetIdentityComp = world.getComponent(targetId, IdentityComponent);

        if (!sourceTagsComp || !targetTagsComp || !actorPosComp || !actorIdentityComp || !sourceIdentityComp || !targetIdentityComp) {
            return;
        }

        const sourceTags = Array.from(sourceTagsComp.tags);
        const targetTags = Array.from(targetTagsComp.tags);

        for (const rule of this.interactionRules) {
            if (rule.interaction_type === 'DIP') {
                const conditionsMet = this.checkConditions(rule.conditions, [], [], sourceTags, targetTags);
                if (conditionsMet) {
                    this.applyEffects(rule.effects, actorPosComp, sourceId, targetId);
                    globalServiceLocator.feedback.addMessageToLog(`${actorIdentityComp.name} dips ${targetIdentityComp.name} into ${sourceIdentityComp.name}.`, 'green');
                }
            }
        }
    }
}
