import { World } from "../world.mjs";
import { ActiveTurnComponent, EffectsComponent, ModifiersComponent } from "../components/index.mjs";

/**
 * Manages the duration of temporary effects.
 * This system should be run at the end of each entity's turn.
 */
export class EffectLifecycleSystem {
    public update(world: World): void {
        // Find the entity whose turn just ended.
        const entitiesWithActiveTurn = world.getEntitiesWith(ActiveTurnComponent);
        if (entitiesWithActiveTurn.length === 0) {
            return; // Not in combat or no active turn.
        }
        const currentActorId = entitiesWithActiveTurn[0];

        const effectsComp = world.getComponent(currentActorId, EffectsComponent);
        if (!effectsComp || effectsComp.activeEffects.length === 0) {
            return; // No effects to process.
        }

        const expiredEffectSourceIds: string[] = [];

        // Decrement duration and find expired effects
        for (const effect of effectsComp.activeEffects) {
            if (effect.duration !== Infinity) {
                effect.duration--;
                if (effect.duration <= 0) {
                    expiredEffectSourceIds.push(effect.sourceId);
                }
            }
        }

        // If no effects expired, we're done.
        if (expiredEffectSourceIds.length === 0) {
            return;
        }

        // Remove expired effects from the component
        effectsComp.activeEffects = effectsComp.activeEffects.filter(
            e => !expiredEffectSourceIds.includes(e.sourceId)
        );

        // Remove the modifiers associated with the expired effects
        const modsComp = world.getComponent(currentActorId, ModifiersComponent);
        if (modsComp) {
            modsComp.modifiers = modsComp.modifiers.filter(
                m => m.sourceId && !expiredEffectSourceIds.includes(m.sourceId)
            );
        }
        
        console.log(`[EffectLifecycle] Pruned expired effects for entity ${currentActorId}.`);
    }
}
