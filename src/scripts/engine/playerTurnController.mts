import { Action, ActionType } from './actions/action.mjs';
import { MeleeAttackAction } from './actions/meleeAttackAction.mjs';
import { MoveAction } from './actions/moveAction.mjs';
import { PassTurnAction } from './actions/passTurnAction.mjs';
import { GameEvents } from './events.mjs';
import { globalServiceLocator } from './serviceLocator.mjs';
import { EntityPosition } from './utils.mjs';
import { EntityID } from './ecs/world.mjs';
import { ActionBudgetComponent, EquipmentComponent } from './ecs/components/index.mjs';

type PlayerInteractionState = 'AWAITING_INPUT' | 'TARGETING' | 'AWAITING_INTERRUPT';

export class PlayerTurnController {
    private interactionState: PlayerInteractionState = 'AWAITING_INPUT';
    private pendingAction: ((target: EntityID) => Action) | null = null;

    constructor() {
        const ui = globalServiceLocator.ui;
        const eventBus = globalServiceLocator.eventBus;

        ui.btns['attackButton'].onclick = () => eventBus.publish(GameEvents.UI_BUTTON_ATTACK_CLICKED);
        eventBus.subscribe(GameEvents.UI_BUTTON_ATTACK_CLICKED, () => this.onAttackButtonClick());
        eventBus.subscribe(GameEvents.UI_MAP_CLICKED, (event) => this.handleMapClick(event.data.entity));
        eventBus.subscribe(GameEvents.UI_INPUT_CANCELED, () => this.cancelTargeting());
        ui.btns['endTurnButton'].onclick = () => this.onEndTurnClick();

        eventBus.subscribe(GameEvents.COMBAT_START, () => this.updateAvailableActionUI());
        eventBus.subscribe(GameEvents.COMBAT_END, () => this.updateAvailableActionUI());
        eventBus.subscribe(GameEvents.COMBAT_TURN_START, (event) => {
            if (event.data.entity === globalServiceLocator.state.playerId) {
                this.updateAvailableActionUI();
            }
        });

        eventBus.subscribe(GameEvents.PLAYER_INTERRUPT_PROMPT, () => {
            this.interactionState = 'AWAITING_INTERRUPT';
            this.updateAvailableActionUI();
        });

        eventBus.subscribe(GameEvents.UI_INTERRUPT_RESOLVED, () => {
            this.interactionState = 'AWAITING_INPUT';
            this.updateAvailableActionUI();
        });
    }

    private handleMapClick(entityId: EntityID | null): void {
        if (this.interactionState !== 'TARGETING' || !entityId || !this.pendingAction) {
            this.cancelTargeting();
            return;
        }
        const actionToProcess = this.pendingAction(entityId);
        globalServiceLocator.turnManager.processPlayerAction(actionToProcess);
        this.interactionState = 'AWAITING_INPUT';
        globalServiceLocator.ui.els.body.style.cursor = 'default';
        this.updateAvailableActionUI();
    }

    public onAttackButtonClick(): void {
        const player = globalServiceLocator.state.playerId;
        if (this.interactionState !== 'AWAITING_INPUT' || !this.canAfford(ActionType.Standard) || !player) return;

        this.interactionState = 'TARGETING';
        const world = globalServiceLocator.world;
        const equipment = world.getComponent(player, EquipmentComponent);
        const weapon = equipment ? equipment.getEquippedWeapon() : null;

        this.pendingAction = (target: EntityID): Action => {
            return new MeleeAttackAction(player, target, weapon || undefined);
        };
        globalServiceLocator.ui.els.body.style.cursor = 'crosshair';
    }

    public onMoveInput(direction: EntityPosition): void {
        const player = globalServiceLocator.state.playerId;
        if (this.interactionState !== 'AWAITING_INPUT' || !this.canAfford(ActionType.Move) || !player) return;

        const moveAction = new MoveAction(player, direction);
        globalServiceLocator.turnManager.processPlayerAction(moveAction);
        this.updateAvailableActionUI();
    }

    private onEndTurnClick(): void {
        const player = globalServiceLocator.state.playerId;
        if (!player) return;
        globalServiceLocator.turnManager.processPlayerAction(new PassTurnAction(player));
    }

    public cancelTargeting(): void {
        this.interactionState = 'AWAITING_INPUT';
        this.pendingAction = null;
        globalServiceLocator.ui.els.body.style.cursor = 'default';
    }

    private canAfford(cost: ActionType): boolean {
        if (!globalServiceLocator.turnManager.isCombatActive) return true;

        const player = globalServiceLocator.state.playerId;
        if (!player) return false;

        const world = globalServiceLocator.world;
        const budget = world.getComponent(player, ActionBudgetComponent);
        if (!budget) return false;

        switch (cost) {
            case ActionType.Standard: return budget.standardActions > 0;
            case ActionType.Move: return budget.moveActions > 0;
            case ActionType.FullRound: return budget.standardActions > 0 && budget.moveActions > 0;
            case ActionType.Swift: return budget.swiftActions > 0;
            case ActionType.Free: return true; // Free actions are always affordable
        }
    }

    private spendCost(cost: ActionType): void {
        if (!globalServiceLocator.turnManager.isCombatActive) return;

        const player = globalServiceLocator.state.playerId;
        if (!player) return;

        const world = globalServiceLocator.world;
        const budget = world.getComponent(player, ActionBudgetComponent);
        if (!budget) return;

        switch (cost) {
            case ActionType.Standard: budget.standardActions--; break;
            case ActionType.Move: budget.moveActions--; break;
            case ActionType.FullRound: budget.standardActions = 0; budget.moveActions = 0; break;
            case ActionType.Swift: budget.swiftActions--; break;
            case ActionType.Free: break;
        }
    }

    private updateAvailableActionUI(): void {
        const isCombat = globalServiceLocator.turnManager.isCombatActive;
        const isPlayerTurn = this.interactionState !== 'AWAITING_INTERRUPT';
        const ui = globalServiceLocator.ui;

        ui.btns['endTurnButton'].style.display = isCombat && isPlayerTurn ? '' : 'none';
        ui.btns['attackButton'].disabled = !this.canAfford(ActionType.Standard) || !isPlayerTurn;
    }
}
