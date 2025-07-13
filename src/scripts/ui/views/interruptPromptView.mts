import { Action } from "../../engine/actions/action.mjs";
import { GameEvents } from "../../engine/events.mjs";
import { Interrupt } from "../../engine/interruptManager.mjs";
import { globalServiceLocator } from "../../engine/serviceLocator.mjs";

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
        this.title.textContent = `${interrupt.sourceEntity.name} provokes an attack of opportunity!`;

        // Add a button for each potential action
        interrupt.potentialActions.forEach(action => {
            const button = document.createElement('button');
            let buttonText = action.constructor.name.replace('Action', ''); // e.g., "MeleeAttack"
            if ('target' in action && action.target) {
                buttonText += ` ${(action.target as any).name}`;
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
