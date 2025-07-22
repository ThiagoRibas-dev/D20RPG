import { globalServiceLocator } from "../../serviceLocator.mjs";
import { World } from "../world.mjs";
import { ExecuteActionComponent } from "../components/index.mjs";

export class ActionExecutionSystem {
    public update(world: World): void {
        const view = world.view(ExecuteActionComponent);
        for (const { entity, components } of view) {
            const [executeAction] = components;
            const { action } = executeAction;

            console.log(`[ActionExecutionSystem] Executing action ${action.id} for entity ${entity}`);

            globalServiceLocator.scriptingService.execute(
                `../../../content/actions/dnd35/${action.id}.mjs`,
                "execute",
                world,
                entity,
                action.target // Assuming a target is passed in the action data
            );

            // Remove the component so the action isn't executed again
            world.removeComponent(entity, ExecuteActionComponent);
        }
    }
}
