import {
    AIComponent,
    AttributesComponent,
    ExecuteActionComponent,
    IdentityComponent,
    PossibleActionsComponent,
    StateComponent
} from '../../../scripts/engine/ecs/components/index.mjs';

/**
 * A simple aggressive melee AI behavior.
 * The AI will attempt to move towards and attack the nearest enemy.
 *
 * @param {import('../../../scripts/engine/ecs/world.mjs').World} world The game world.
 * @param {import('../../../scripts/engine/ecs/world.mjs').EntityID} entityId The ID of the AI entity.
 */
export function execute(world, entityId) {
    const ai = world.getComponent(entityId, AIComponent);
    if (!ai) return;

    // 1. Find a target if we don't have one.
    if (!ai.targetId) {
        let closestEnemy = null;
        let minDistance = Infinity;

        // This is a very inefficient way to find the closest enemy.
        // A real implementation would use a spatial partitioning system.
        for (const otherEntityId of world.view(IdentityComponent, AttributesComponent, StateComponent)) {
            if (otherEntityId.entity === entityId) continue;

            const selfState = world.getComponent(entityId, StateComponent);
            const targetState = world.getComponent(otherEntityId.entity, StateComponent);

            if (selfState && targetState) {
                const selfPos = selfState.states.get('position');
                const targetPos = targetState.states.get('position');
                const distance = Math.sqrt(Math.pow(selfPos.x - targetPos.x, 2) + Math.pow(selfPos.y - targetPos.y, 2));

                if (distance < minDistance) {
                    minDistance = distance;
                    closestEnemy = otherEntityId.entity;
                }
            }
        }
        ai.targetId = closestEnemy;
    }

    if (!ai.targetId) {
        console.log(`AI ${entityId} has no target.`);
        return; // No target found, do nothing.
    }

    // 2. Check for possible actions.
    const possibleActions = world.getComponent(entityId, PossibleActionsComponent);
    if (!possibleActions || possibleActions.actions.length === 0) {
        return; // No actions available.
    }

    // 3. Decide what to do.
    // Prioritize attacking if possible.
    const attackAction = possibleActions.actions.find(a => a.id === 'melee_attack' && a.target === ai.targetId);
    if (attackAction) {
        world.addComponent(entityId, new ExecuteActionComponent(attackAction));
        console.log(`AI ${entityId} is attacking ${ai.targetId}`);
    } else {
        // If we can't attack, try to move closer.
        // This is a placeholder for pathfinding.
        console.log(`AI ${entityId} would move towards ${ai.targetId}`);
    }
}
