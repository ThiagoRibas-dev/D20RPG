import { Action } from "../../engine/actions/action.mjs";
import { GameEvents } from "../../engine/events.mjs";
import { globalServiceLocator } from "../../engine/serviceLocator.mjs";
import { IdentityComponent } from "../../engine/ecs/components/index.mjs";
import { Interrupt } from "../../engine/ecs/systems/interruptSystem.mjs";

export class InterruptPromptView {
    private container: HTMLElement;
    private title: HTMLElement;
    private actionsContainer: HTMLElement;

    constructor() {
        this.container = document.getElementById('interruptPrompt') as HTMLElement;
        this.title = document.getElementById('interruptTitle') as HTMLElement;
        this.actionsContainer = document.getElementById('interruptActionsContainer') as HTMLElement;
    }

    public show(): void {
        this.container.style.display = '';
    }

    public hide(): void {
        this.container.style.display = 'none';
        this.actionsContainer.innerHTML = ''; // Clear old actions
        globalServiceLocator.eventBus.publish(GameEvents.UI_INTERRUPT_RESOLVED, {});
    }

    public render(interrupt: Interrupt): void {
        const sourceEntityName = globalServiceLocator.world.getComponent(interrupt.sourceEntity, IdentityComponent)?.name || 'Someone';
        this.title.textContent = `${sourceEntityName} provokes an attack of opportunity!`;

        // Add a button for each potential action
        interrupt.potentialActions.forEach(action => {
            const button = document.createElement('button');
            let buttonText = action.name;
            if (action.target && typeof action.target === 'number') {
                const targetName = globalServiceLocator.world.getComponent(action.target, IdentityComponent)?.name || 'someone';
                buttonText += ` ${targetName}`;
            }
            button.textContent = buttonText;
            button.onclick = () => {
                globalServiceLocator.turnManager.addInterrupt(action);
                this.hide();
            };
            this.actionsContainer.appendChild(button);
        });

        // Add a "Decline" button
        const declineButton = document.createElement('button');
        declineButton.textContent = 'Decline';
        declineButton.onclick = () => {
            console.log("Player declined to take the interrupt action.");
            this.hide();
        };
        this.actionsContainer.appendChild(declineButton);

        this.show();
    }
}
