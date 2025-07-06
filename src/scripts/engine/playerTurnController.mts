import { Action, ActionType } from './actions/action.mjs';
import { MeleeAttackAction } from './actions/meleeAttackAction.mjs';
import { Entity } from './entities/entity.mjs';
import { PlayerCharacter } from './entities/playerCharacter.mjs';
import { ServiceLocator } from './serviceLocator.mjs';

/**
 * Defines the budget of actions a character has on their turn.
 */
interface ActionBudget {
    standard: number;
    move: number;
    swift: number;
    free: number;
    hasTaken5FootStep: boolean;
}

/**
* Defines the different states the player can be in during their turn.
*/
type PlayerInteractionState = 'AWAITING_INPUT' | 'TARGETING';

/**
 * Manages the player's turn, including their action budget and UI interaction state.
 * It translates player input (button clicks) into formal `Action` objects.
 */
export class PlayerTurnController {
    private activeCharacter: PlayerCharacter | null = null;
    private budget: ActionBudget | null = null;
    private interactionState: PlayerInteractionState = 'AWAITING_INPUT';

    // The action that is pending a target selection.
    private pendingAction: ((target: Entity) => Action) | null = null;

    constructor() {
        // Listen for the start of any turn.
        ServiceLocator.EventBus.subscribe('combat:turn:start', (data: { entity: Entity }) => {
            // Check if the turn is for the player character.
            if (data.entity instanceof PlayerCharacter) {
                this.beginTurn(data.entity);
            } else {
                this.endTurn(); // End our control if it's an NPC's turn.
            }
        });

        const attackButton = ServiceLocator.UI.btns['attackButton'];
        if (attackButton) {
            attackButton.onclick = () => this.onAttackButtonClick();
        } else {
            console.error("Attack button not found in UIHolder on PlayerTurnController init.");
        }
    }

    /**
     * Called when the player's turn officially begins.
     * @param player The player character whose turn it is.
     */
    private beginTurn(player: PlayerCharacter): void {
        console.log("PlayerTurnController: Beginning player's turn.");
        this.activeCharacter = player;
        this.interactionState = 'AWAITING_INPUT';
        // Grant the player their action budget for the round.
        this.budget = { standard: 1, move: 1, swift: 1, free: 5, hasTaken5FootStep: false };
        this.updateAvailableActionUI();
    }

    /**
     * Called when the player's turn ends or an NPC's turn begins.
     * Resets the controller's state.
     */
    private endTurn(): void {
        this.activeCharacter = null;
        this.budget = null;
        this.interactionState = 'AWAITING_INPUT';
        // Here you would disable all action buttons.
        this.updateAvailableActionUI();
    }

    /**
     * Initiates the attack sequence by putting the controller into a 'TARGETING' state.
     * This is called by the "Attack" button's onclick handler.
     */
    public onAttackButtonClick(): void {
        if (this.interactionState !== 'AWAITING_INPUT' || !this.canAfford(ActionType.Standard)) {
            console.warn("Cannot initiate attack: Not awaiting input or no standard action available.", this.interactionState);
            return;
        }

        console.log("PlayerTurnController: Entering TARGETING state for melee attack.");
        this.interactionState = 'TARGETING';

        // When a target is selected, we want to create a MeleeAttackAction.
        this.pendingAction = (target: Entity): Action => {
            const weapon = this.activeCharacter!.getEquippedWeapon();
            if (!weapon) {
                console.error("Cannot attack: No weapon equipped.");
                // This is a bit tricky. We need to return a "null" action or handle this case.
                // For now, we'll assume a weapon is always present.
            }
            return new MeleeAttackAction(this.activeCharacter!, target, weapon);
        };

        ServiceLocator.UI.els.body.style.cursor = 'crosshair';
    }

    /**
     * Called by the Renderer when the player clicks on the map.
     * @param entity The entity that was clicked on, or null if empty tile.
     */
    public onMapClick(entity: Entity | null): void {
        if (this.interactionState !== 'TARGETING') {
            return; // Ignore map clicks if not in targeting mode.
        }

        if (entity && this.pendingAction) {
            // We have a target and a pending action. Let's create and process it.
            const actionToProcess = this.pendingAction(entity);
            this.processAction(actionToProcess);
        } else {
            // Player clicked an empty tile or no action was pending. Cancel targeting.
            this.cancelTargeting();
        }
    }

    /**
     * Called when the player right-clicks or presses Escape to cancel targeting.
     */
    public cancelTargeting(): void {
        console.log("PlayerTurnController: Cancelling targeting.");
        this.interactionState = 'AWAITING_INPUT';
        this.pendingAction = null;
        ServiceLocator.UI.els.body.style.cursor = 'default';
    }

    // --- PRIVATE LOGIC ---
    private processAction(action: Action): void {
        if (!this.canAfford(action.cost)) {
            console.log(`Cannot afford action: ${ActionType[action.cost]}`);
            this.cancelTargeting();
            return;
        }

        // 1. Spend the action points from the budget.
        this.spendCost(action.cost);

        // 2. Lock the UI and execute the action.
        this.interactionState = 'AWAITING_INPUT'; // Reset state before execution
        ServiceLocator.UI.els.body.style.cursor = 'default';

        action.execute(); // This will trigger the event chain.

        // 3. Update the UI to reflect the new budget.
        this.updateAvailableActionUI();

        // NOTE: In a full implementation, we wouldn't auto-end the turn.
        // The player would click an "End Turn" button which calls TurnManager.advanceTurn().
    }

    /**
     * Checks if the current action budget can pay for a given action cost.
     */
    private canAfford(cost: ActionType): boolean {
        if (!this.budget) return false;

        switch (cost) {
            case ActionType.Standard: return this.budget.standard > 0;
            case ActionType.Move: return this.budget.move > 0;
            case ActionType.FullRound: return this.budget.standard > 0 && this.budget.move > 0;
            case ActionType.Swift: return this.budget.swift > 0;
            case ActionType.Free: return this.budget.free > 0;
        }
        return false;
    }

    /**
     * Deducts the cost of an action from the budget.
     */
    private spendCost(cost: ActionType): void {
        if (!this.budget) return;

        switch (cost) {
            case ActionType.Standard: this.budget.standard--; break;
            case ActionType.Move: this.budget.move--; break;
            case ActionType.FullRound: this.budget.standard = 0; this.budget.move = 0; break;
            case ActionType.Swift: this.budget.swift--; break;
            case ActionType.Free: this.budget.free--; break;
        }
    }

    /**
     * Updates the UI buttons based on the current action budget.
     */
    private updateAvailableActionUI(): void {
        // This is where you would enable/disable the HTML buttons.
        const attackButton = ServiceLocator.UI.btns['attackButton'];
        if (attackButton) {
            attackButton.disabled = !this.canAfford(ActionType.Standard);
        }
        // ... update other buttons for Move, Cast Spell, etc.
    }
}