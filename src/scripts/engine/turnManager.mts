import { Action, ActionType } from "./actions/action.mjs";
import { PassTurnAction } from "./actions/passTurnAction.mjs";
import { GameEvents } from "./events.mjs";
import { globalServiceLocator } from "./serviceLocator.mjs";
import { getRandomInt, calculateModifier } from "./utils.mjs";
import { ActiveTurnComponent, ActionBudgetComponent, AttributesComponent, IdentityComponent, AIComponent, PlayerControlledComponent, PositionComponent } from "./ecs/components/index.mjs";
import { EntityID } from "./ecs/world.mjs";

type TurnQueueEntry = {
    entityId: EntityID;
    initiative: number;
}

export class TurnManager {
    private turnQueue: TurnQueueEntry[] = [];
    private actionStack: Action[] = [];
    private currentTurnIndex: number = -1;
    private roundNumber: number = 0;
    private _isCombatActive: boolean = false;

    public get isCombatActive(): boolean { return this._isCombatActive; }

    constructor() {
        console.log("TurnManager initialized.");
        globalServiceLocator.eventBus.subscribe(GameEvents.CHARACTER_DIED, (event) => {
            this.removeEntityFromCombat(event.data.entityId);
            this.checkForCombatEnd();
        });
    }

    public async startCombat(combatantIds: EntityID[]) {
        if (this._isCombatActive) return;

        this._isCombatActive = true;
        this.roundNumber = 1;

        const initiativePromises = combatantIds.map(async (id) => {
            const initiativeBonus = await globalServiceLocator.modifierManager.queryStat(id, 'initiative');
            const initiative = initiativeBonus + getRandomInt(1, 20);
            return { entityId: id, initiative };
        });

        const initiativeList = await Promise.all(initiativePromises);

        initiativeList.sort((a, b) => b.initiative - a.initiative);
        this.turnQueue = initiativeList;

        console.log("--- COMBAT STARTED ---");
        const world = globalServiceLocator.world;
        const turnOrderNames = this.turnQueue.map(item => {
            const identity = world.getComponent(item.entityId, IdentityComponent);
            return identity ? `${identity.name} (${item.initiative})` : `Entity ${item.entityId} (${item.initiative})`;
        });
        console.log("Turn Order:", turnOrderNames);
        globalServiceLocator.eventBus.publish(GameEvents.COMBAT_START, { combatants: this.turnQueue.map(item => item.entityId) });

        this.currentTurnIndex = -1;
        await this.advanceTurn();
    }

    public endCombat(): void {
        if (!this._isCombatActive) return;

        console.log("--- COMBAT ENDED ---");
        globalServiceLocator.eventBus.publish(GameEvents.COMBAT_END, { result: 'victory' });

        this._isCombatActive = false;
        this.turnQueue = [];
        this.currentTurnIndex = -1;
        this.roundNumber = 0;

        this.runExplorationTick();
    }

    public async addCombatant(entityId: EntityID): Promise<void> {
        if (!this._isCombatActive) return;

        const initiativeBonus = await globalServiceLocator.modifierManager.queryStat(entityId, 'initiative');
        const initiative = initiativeBonus + getRandomInt(1, 20);

        const newEntry = { entityId, initiative };

        const insertionIndex = this.turnQueue.findIndex(item => item.initiative < newEntry.initiative);

        if (insertionIndex === -1) {
            this.turnQueue.push(newEntry);
        } else {
            this.turnQueue.splice(insertionIndex, 0, newEntry);
            if (insertionIndex <= this.currentTurnIndex) {
                this.currentTurnIndex++;
            }
        }
        const world = globalServiceLocator.world;
        const identity = world.getComponent(entityId, IdentityComponent);
        console.log(`${identity ? identity.name : `Entity ${entityId}`} joins the fight!`);
    }

    public addInterrupt(action: Action): void {
        this.actionStack.unshift(action);
        this.processActionStack(globalServiceLocator.world);
    }

    public async advanceTurn() {
        if (!this._isCombatActive) {
            this.runExplorationTick();
        } else {
            await this.runCombatTurn();
        }
    }

    private runExplorationTick(): void {
        console.log("--- Exploration Tick ---");
        const world = globalServiceLocator.world;
        globalServiceLocator.state.npcs.forEach(npcId => {
            // TODO: AI System will replace aiManager
            // const action = globalServiceLocator.aiSystem.processTurn(npcId);
            // if (action) {
            //     action.execute();
            // }
        });

        const playerId = globalServiceLocator.state.playerId;
        if (playerId !== null) {
            // TODO: Action budget will be a component
        }
    }

    private async runCombatTurn() {
        await this.processActionStack(globalServiceLocator.world);

        if (!this.isCombatActive) return;

        if (this.currentTurnIndex >= 0 && this.turnQueue[this.currentTurnIndex]) {
            const previousCombatantId = this.turnQueue[this.currentTurnIndex].entityId;
            globalServiceLocator.world.removeComponent(previousCombatantId, ActiveTurnComponent);
            globalServiceLocator.eventBus.publish(GameEvents.COMBAT_TURN_END, { entityId: previousCombatantId });
        }

        this.currentTurnIndex++;

        if (this.currentTurnIndex >= this.turnQueue.length) {
            this.currentTurnIndex = 0;
            this.roundNumber++;
            console.log(`--- ROUND ${this.roundNumber} ---`);
            globalServiceLocator.tileStateManager.updateDurations();
            globalServiceLocator.eventBus.publish(GameEvents.COMBAT_ROUND_START, { roundNumber: this.roundNumber });
        }

        if (!this.turnQueue[this.currentTurnIndex]) {
            return;
        }

        const currentActorId = this.turnQueue[this.currentTurnIndex].entityId;
        const world = globalServiceLocator.world;
        const identity = world.getComponent(currentActorId, IdentityComponent);

        const budget = world.getComponent(currentActorId, ActionBudgetComponent);
        if (budget) {
            budget.standardActions = 1;
            budget.moveActions = 1;
            budget.swiftActions = 1;
            // Attacks of opportunity are reset at the start of the round, not turn.
        }

        const canAct = true; // TODO: Check for stun, etc. via StateComponent
        if (!canAct) {
            console.log(`${identity ? identity.name : `Entity ${currentActorId}`}'s turn is skipped.`);
            globalServiceLocator.eventBus.publish(GameEvents.COMBAT_TURN_SKIPPED, { entityId: currentActorId });
            await this.advanceTurn();
            return;
        }

        world.addComponent(currentActorId, new ActiveTurnComponent());
        console.log(`Turn starts for: ${identity ? identity.name : `Entity ${currentActorId}`}`);
        this.applyTerrainEffects(currentActorId);
        globalServiceLocator.eventBus.publish(GameEvents.COMBAT_TURN_START, { entityId: currentActorId });

        if (world.hasComponent(currentActorId, PlayerControlledComponent)) {
            // Player turn
        } else if (world.hasComponent(currentActorId, AIComponent)) {
            await this.handleNpcTurn(currentActorId);
        } else {
            // No controller, pass turn
            // this.addInterrupt(new PassTurnAction(currentActorId));
        }
    }

    private async handleNpcTurn(npcId: EntityID) {
        // TODO: AI System will replace aiManager
        // const action = globalServiceLocator.aiSystem.processTurn(npcId);
        // this.actionStack.push(action);
        await this.processActionStack(globalServiceLocator.world);
    }

    public async processPlayerAction(action: Action): Promise<void> {
        const world = globalServiceLocator.world;
        if (!this.isCombatActive) {
            action.execute(world);
            this.advanceTurn();
            return;
        }

        this.actionStack.push(action);
        await this.processActionStack(globalServiceLocator.world);
    }

    private async processActionStack(world: any): Promise<void> {
        while (this.actionStack.length > 0) {
            const action = this.actionStack.shift();
            if (!action) continue;

            // TODO: Refactor action cost system
            // if (!this.canAfford(action.actor, action.cost)) {
            //     continue;
            // }
            // this.spendCost(action.actor, action.cost);

            action.execute(world);
            if (!world.hasComponent(action.actor, PlayerControlledComponent)) {
                const RENDER_DELAY_MS = 150;
                await new Promise(resolve => setTimeout(resolve, RENDER_DELAY_MS));
            }

            // TODO: Refactor turn over logic
            // if (action instanceof PassTurnAction || this.isTurnOver(action.actor)) {
            //     this.checkForCombatEnd();
            //     if (this.isCombatActive) {
            //         await this.advanceTurn();
            //     }
            // }
        }
    }
    
    private isTurnOver(actorId: EntityID): boolean {
        // TODO: Refactor with component-based action budget
        return false;
    }

    private spendCost(actorId: EntityID, cost: ActionType): void {
        // TODO: Refactor with component-based action budget
    }

    private canAfford(actorId: EntityID, cost: ActionType): boolean {
        // TODO: Refactor with component-based action budget
        return true;
    }

    private async removeEntityFromCombat(entityIdToRemove: EntityID) {
        if (!this._isCombatActive) return;

        const index = this.turnQueue.findIndex(item => item.entityId === entityIdToRemove);
        if (index > -1) {
            const removed = this.turnQueue.splice(index, 1);
            const world = globalServiceLocator.world;
            const identity = world.getComponent(removed[0].entityId, IdentityComponent);
            console.log(`${identity ? identity.name : `Entity ${removed[0].entityId}`} removed from combat queue.`);

            if (index < this.currentTurnIndex) {
                this.currentTurnIndex--;
            }
        }
    }

    public checkForCombatEnd(): void {
        if (!this._isCombatActive) return;
        
        const world = globalServiceLocator.world;
        const hostilesRemain = this.turnQueue.some(item => {
            const ai = world.getComponent(item.entityId, AIComponent);
            const attributes = world.getComponent(item.entityId, AttributesComponent);
            const hp = attributes ? attributes.attributes.get('hp_current') || 0 : 0;
            // TODO: Disposition should be a component or tag
            return ai && hp > 0;
        });

        if (!hostilesRemain) {
            this.endCombat();
        }
    }

    private applyTerrainEffects(entityId: EntityID): void {
        const world = globalServiceLocator.world;
        const position = world.getComponent(entityId, PositionComponent);
        if (!position) return;

        // TODO: Reimplement terrain effects
    }
}
