import { PossibleActionsComponent } from "../../../scripts/engine/ecs/components/possibleActionsComponent.mjs";
import { TagsComponent } from "../../../scripts/engine/ecs/components/tagsComponent.mjs";
import { StateComponent } from "../../../scripts/engine/ecs/components/stateComponent.mjs";
import { World } from "../../../scripts/engine/ecs/world.mjs";

export function determinePossibleActions(world, entityId) {
    const possibleActions = world.getComponent(entityId, PossibleActionsComponent);
    if (!possibleActions) {
        return;
    }

    // For now, we'll just add a melee attack action if the entity is hostile.
    // Later, we'll add more complex logic here.
    const tags = world.getComponent(entityId, TagsComponent);
    if (tags && tags.tags.has("hostile")) {
        possibleActions.actions.push({
            id: "melee_attack",
            name: "Melee Attack",
            description: "Attack a foe in an adjacent square."
        });
    }
}
