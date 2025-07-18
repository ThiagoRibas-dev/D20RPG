import { Action, ActionType } from './actions/action.mjs';
import { MeleeAttackAction } from './actions/meleeAttackAction.mjs';
import { MoveAction } from './actions/moveAction.mjs';
import { Entity } from './entities/entity.mjs';
import { globalServiceLocator } from './serviceLocator.mjs';
import { EntityPosition } from './utils.mjs';


/**
* Defines the different states the player can be in during their turn.
*/
type PlayerInteractionState = 'AWAITING_INPUT' | 'TARGETING';

/**
 * Manages the player's turn, including their action budget and UI interaction state.
 * It translates player input (button clicks) into formal `Action` objects.
 */
export class PlayerTurnController {
    private interactionState: PlayerInteractionState = 'AWAITING_INPUT';
    private pendingAction: ((target: Entity) => Action) | null = null;

    constructor() {
        const ui = globalServiceLocator.ui;
        const eventBus = globalServiceLocator.eventBus;

        // Subscribe to the events published by the UI layer (Renderer, etc.)
        ui.btns['attackButton'].onclick = () => eventBus.publish('ui:button:attack_clicked');
        eventBus.subscribe('ui:button:attack_clicked', () => this.onAttackButtonClick());
        eventBus.subscribe('ui:map:clicked', (data: { entity: Entity | null }) => this.handleMapClick(data.entity));
        eventBus.subscribe('ui:input:canceled', () => this.cancelTargeting());
        ui.btns['endTurnButton'].onclick = () => this.onEndTurnClick();

        // React to combat state changes to update the UI
        eventBus.subscribe('combat:start', () => this.updateAvailableActionUI());
        eventBus.subscribe('combat:end', () => this.updateAvailableActionUI());
        eventBus.subscribe('combat:turn:start', (data) => {
            if (data.entity === globalServiceLocator.state.player) {
                this.updateAvailableActionUI();
            }
        });
    }

    /**
     * This is the new handler that listens for the generic 'ui:map:clicked' event.
     * @param entity The entity that was clicked on, or null if empty tile.
     */
    private handleMapClick(entity: Entity | null): void {
        if (this.interactionState !== 'TARGETING' || !entity || !this.pendingAction) {
            this.cancelTargeting();
            return;
        }
        const actionToProcess = this.pendingAction(entity);
        this.processAction(actionToProcess);
    }

    public onAttackButtonClick(): void {
        const player = globalServiceLocator.state.player;
        if (this.interactionState !== 'AWAITING_INPUT' || !this.canAfford(ActionType.Standard) || !player) return;

        this.interactionState = 'TARGETING';
        const weapon = player.getEquippedWeapon();
        this.pendingAction = (target: Entity): Action => {
            return new MeleeAttackAction(player, target, weapon);
        };
        globalServiceLocator.ui.els.body.style.cursor = 'crosshair';
    }

    public onMoveInput(direction: EntityPosition): void {
        const player = globalServiceLocator.state.player;
        if (this.interactionState !== 'AWAITING_INPUT' || !this.canAfford(ActionType.Move) || !player) return;

        const moveAction = new MoveAction(player, direction);
        this.processAction(moveAction);
    }

    /**
     * The player explicitly ends their turn during combat.
     * This is the only way to advance the turn queue when it is the player's turn.
     */
    private onEndTurnClick(): void {
        // This button should only be clickable during combat.
        globalServiceLocator.turnManager.advanceTurn();
    }

    public cancelTargeting(): void {
        this.interactionState = 'AWAITING_INPUT';
        this.pendingAction = null;
        globalServiceLocator.ui.els.body.style.cursor = 'default';
    }

    // --- ACTION PROCESSING ---
    /**
    * Processes a single player action. It deducts the cost and executes the action.
    * Crucially, it only advances the turn automatically when in Exploration mode.
    */
    private processAction(action: Action): void {
        if (!this.canAfford(action.cost)) {
            console.log("Cannot afford action.");
            return;
        }

        this.spendCost(action.cost);
        this.interactionState = 'AWAITING_INPUT';
        globalServiceLocator.ui.els.body.style.cursor = 'default';

        action.execute(); // Trigger the event chain

        this.updateAvailableActionUI(); // Refresh UI based on new budget

        // In Exploration Mode, the world gets a "tick" immediately after the player acts.
        if (!globalServiceLocator.turnManager.isCombatActive) {
            globalServiceLocator.turnManager.advanceTurn();
        }
        // In Combat Mode, we do NOT advance the turn here. We wait for the "End Turn" button.
    }

    /**
     * Checks if the current action budget can pay for a given action cost.
     */
    private canAfford(cost: ActionType): boolean {
        // Outside of combat, actions are always affordable.
        if (!globalServiceLocator.turnManager.isCombatActive) return true;

        const budget = globalServiceLocator.state.player?.actionBudget;
        if (!budget) return false;

        switch (cost) {
            case ActionType.Standard: return budget.standard > 0;
            case ActionType.Move: return budget.move > 0;
            case ActionType.FullRound: return budget.standard > 0 && budget.move > 0;
            case ActionType.Swift: return budget.swift > 0;
            case ActionType.Free: return budget.free > 0;
        }
    }
    /**
     * Deducts the cost of an action from the budget.
     */
    private spendCost(cost: ActionType): void {
        // Only spend cost if we are in combat.
        if (!globalServiceLocator.turnManager.isCombatActive) return;

        const budget = globalServiceLocator.state.player?.actionBudget;
        if (!budget) return;

        switch (cost) {
            case ActionType.Standard: budget.standard--; break;
            case ActionType.Move: budget.move--; break;
            case ActionType.FullRound: budget.standard = 0; budget.move = 0; break;
            case ActionType.Swift: budget.swift--; break;
            case ActionType.Free: budget.free--; break;
        }
    }

    /**
       * Updates the state of UI action buttons based on the current game mode and action budget.
       */
    private updateAvailableActionUI(): void {
        const isCombat = globalServiceLocator.turnManager.isCombatActive;
        const ui = globalServiceLocator.ui;

        // The "End Turn" button is only visible and relevant during combat.
        ui.btns['endTurnButton'].style.display = isCombat ? '' : 'none';

        // Disable/enable action buttons based on affordability.
        ui.btns['attackButton'].disabled = !this.canAfford(ActionType.Standard);
        // ... update other buttons for Move, Cast Spell, etc.
    }
}