import { globalServiceLocator } from "../../serviceLocator.mjs";
import { World } from "../world.mjs";
import { ActiveTurnComponent, PossibleActionsComponent } from "../components/index.mjs";

export class RulesEngine {
    public update(world: World): void {
        const view = world.view(ActiveTurnComponent);
        for (const { entity } of view) {
            // Ensure the entity has a PossibleActionsComponent
            if (!world.hasComponent(entity, PossibleActionsComponent)) {
                world.addComponent(entity, new PossibleActionsComponent());
            }

            const possibleActions = world.getComponent(entity, PossibleActionsComponent);
            if (possibleActions) {
                possibleActions.actions = []; // Clear previous actions
            }

            // Execute the rule script to determine possible actions
            globalServiceLocator.scriptingService.execute(
                "../../../content/rules/dnd35/standard_actions.mjs",
                "determinePossibleActions",
                world,
                entity
            );

            console.log(`[ECS RulesEngine] Actions for entity ${entity}:`, possibleActions?.actions);
        }
    }
}
