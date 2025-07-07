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
    }

    /**
     * This is the new handler that listens for the generic 'ui:map:clicked' event.
     * @param entity The entity that was clicked on, or null if empty tile.
     */
    private handleMapClick(entity: Entity | null): void {
        if (this.interactionState !== 'TARGETING') {
            return; // Ignore map clicks if not in targeting mode.
        }

        if (entity && this.pendingAction) {
            const actionToProcess = this.pendingAction(entity);
            this.processAction(actionToProcess);
        } else {
            this.cancelTargeting();
        }
    }

    public onAttackButtonClick(): void {
        const player = globalServiceLocator.state.player;
        if (this.interactionState !== 'AWAITING_INPUT' || !this.canAfford(ActionType.Standard) || !player) return;

        this.interactionState = 'TARGETING';
        this.pendingAction = (target: Entity): Action => {
            const weapon = player.getEquippedWeapon();
            return new MeleeAttackAction(player, target, weapon!);
        };
        globalServiceLocator.ui.els.body.style.cursor = 'crosshair';
    }

    public onMoveInput(direction: EntityPosition): void {
        const player = globalServiceLocator.state.player;
        if (this.interactionState !== 'AWAITING_INPUT' || !this.canAfford(ActionType.Move) || !player) return;

        const moveAction = new MoveAction(player, direction);
        this.processAction(moveAction);
    }

    private onEndTurnClick(): void {
        if (globalServiceLocator.turnManager.isCombatActive) {
            globalServiceLocator.turnManager.advanceTurn();
        }
    }

    public cancelTargeting(): void {
        this.interactionState = 'AWAITING_INPUT';
        this.pendingAction = null;
        globalServiceLocator.ui.els.body.style.cursor = 'default';
    }

    // --- ACTION PROCESSING ---
    private processAction(action: Action): void {
        if (!this.canAfford(action.cost)) return;

        this.spendCost(action.cost);
        this.interactionState = 'AWAITING_INPUT';
        globalServiceLocator.ui.els.body.style.cursor = 'default';

        action.execute(); // Trigger the event chain

        this.updateAvailableActionUI();

        // The "WeGo" logic
        if (!globalServiceLocator.turnManager.isCombatActive) {
            globalServiceLocator.turnManager.advanceTurn();
        }
    }

    /**
     * Checks if the current action budget can pay for a given action cost.
     */
    private canAfford(cost: ActionType): boolean {
        const budget = globalServiceLocator.state.player?.actionBudget;
        if (!budget) return true; // Outside of combat, we can always afford it.
        if (!globalServiceLocator.turnManager.isCombatActive) return true;

        switch (cost) {
            case ActionType.Standard: return budget.standard > 0;
            case ActionType.Move: return budget.move > 0;
            case ActionType.FullRound: return budget.standard > 0 && budget.move > 0;
            case ActionType.Swift: return budget.swift > 0;
            case ActionType.Free: return budget.free > 0;
        }
        return false;
    }

    /**
     * Deducts the cost of an action from the budget.
     */
    private spendCost(cost: ActionType): void {
        const budget = globalServiceLocator.state.player?.actionBudget;
        if (!budget || !globalServiceLocator.turnManager.isCombatActive) return;

        switch (cost) {
            case ActionType.Standard: budget.standard--; break;
            case ActionType.Move: budget.move--; break;
            case ActionType.FullRound: budget.standard = 0; budget.move = 0; break;
            case ActionType.Swift: budget.swift--; break;
            case ActionType.Free: budget.free--; break;
        }
    }


    private updateAvailableActionUI(): void {
        const isCombat = globalServiceLocator.turnManager.isCombatActive;
        const ui = globalServiceLocator.ui;

        ui.btns['attackButton'].disabled = !this.canAfford(ActionType.Standard);
        ui.btns['endTurnButton'].style.display = isCombat ? '' : 'none';
        // ... update other buttons for Move, Cast Spell, etc.
    }
}