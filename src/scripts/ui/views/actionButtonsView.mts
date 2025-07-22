import { ExecuteActionComponent } from "../../engine/ecs/components/executeActionComponent.mjs";
import { PossibleActionsComponent } from "../../engine/ecs/components/possibleActionsComponent.mjs";
import { globalServiceLocator } from "../../engine/serviceLocator.mjs";

export class ActionButtonsView {
    private container: HTMLElement;

    constructor() {
        this.container = globalServiceLocator.ui.els.actionButtonsPanel;
    }

    public render(): void {
        this.container.innerHTML = ""; // Clear previous buttons

        const playerId = globalServiceLocator.state.playerId;
        if (!playerId) {
            return;
        }

        const world = globalServiceLocator.world;
        const possibleActions = world.getComponent(playerId, PossibleActionsComponent);

        if (possibleActions) {
            for (const action of possibleActions.actions) {
                const button = document.createElement("button");
                button.innerText = action.name;
                button.onclick = () => {
                    globalServiceLocator.targetingManager.startTargeting(action);
                };
                this.container.appendChild(button);
            }
        }
    }
}
