import { Action, ActionType } from "./actions/action.mjs";
import { PassTurnAction } from "./actions/passTurnAction.mjs";
import { Entity } from "./entities/entity.mjs";
import { Npc } from "./entities/npc.mjs";
import { PlayerCharacter } from "./entities/playerCharacter.mjs";
import { GameEvents } from "./events.mjs";
import { globalServiceLocator } from "./serviceLocator.mjs";

type TurnQueueEntry = {
    entity: Entity;
    initiative: number;
}

export class TurnManager {
    private turnQueue: TurnQueueEntry[] = [];
    private currentTurnIndex: number = -1;
    private roundNumber: number = 0;
    private _isCombatActive: boolean = false;
    private _pendingCombatEndCheck: boolean = false;

    public get isCombatActive(): boolean { return this._isCombatActive; }

    constructor() {
        console.log("TurnManager initialized.");
        globalServiceLocator.eventBus.subscribe(GameEvents.CHARACTER_DIED, (data: { entity: Entity }) => {
            this.removeEntityFromCombat(data.entity);
            this._pendingCombatEndCheck = true;
        });
    }

    /**
     * Kicks off a combat encounter.
     */
    public async startCombat(combatants: Entity[]) {
        if (this._isCombatActive) return; // Idempotent check

        this._isCombatActive = true;
        this.roundNumber = 1;

        const initiativeList = combatants.map(entity => ({
            entity,
            initiative: entity.rollInitiative()
        }));

        initiativeList.sort((a, b) => b.initiative - a.initiative);
        this.turnQueue = initiativeList;

        console.log("--- COMBAT STARTED ---");
        console.log("Turn Order:", this.turnQueue.map(item => `${item.entity.name} (${item.initiative})`));
        globalServiceLocator.eventBus.publish(GameEvents.COMBAT_START, { combatants: this.turnQueue.map(item => item.entity) });

        this.currentTurnIndex = -1;
        await this.advanceTurn();
    }

    /**
     * Ends the current combat encounter.
     */
    public endCombat(): void {
        if (!this._isCombatActive) return;

        console.log("--- COMBAT ENDED ---");
        globalServiceLocator.eventBus.publish(GameEvents.COMBAT_END, { result: 'victory' });

        this._isCombatActive = false;
        this.turnQueue = [];
        this.currentTurnIndex = -1;
        this.roundNumber = 0;

        // Ensure player is ready for exploration
        this.runExplorationTick();
    }

    /**
     * Adds a new entity to an ongoing combat.
     */
    public addCombatant(entity: Entity): void {
        if (!this._isCombatActive) return;

        const newEntry = {
            entity,
            initiative: entity.rollInitiative()
        };

        const insertionIndex = this.turnQueue.findIndex(item => item.initiative < newEntry.initiative);

        if (insertionIndex === -1) {
            this.turnQueue.push(newEntry); // Add to end
        } else {
            this.turnQueue.splice(insertionIndex, 0, newEntry);
            if (insertionIndex <= this.currentTurnIndex) {
                this.currentTurnIndex++; // Adjust index to not skip the new entity or replay a turn
            }
        }
        console.log(`${entity.name} joins the fight!`);
    }

    public async advanceTurn() {
        if (!this._isCombatActive) {
            this.runExplorationTick();
        } else {
            this.runCombatTurn();
        }
    }

    /**
         * Executes one "tick" in Exploration Mode. The player has acted,
         * and now the world gets to react simultaneously.
         */
    private runExplorationTick(): void {
        console.log("--- Exploration Tick ---");
        // 1. Give every NPC a turn to perform non-combat actions.
        globalServiceLocator.state.npcs.forEach(npc => {
            if (npc.aiPackage?.decideAction) {
                const action = npc.aiPackage.decideAction();
                if (action) {
                    // Exploration actions execute immediately. They don't use the turn queue.
                    action.execute();
                }
            }
        });

        // 2. Reset the player's action budget to full for their next action.
        const player = globalServiceLocator.state.player;
        if (player) {
            player.actionBudget = { standard: 1, move: 1, swift: 1, free: 99, hasTaken5FootStep: false, movementPoints: 30 };
        }
    }

    private async runCombatTurn() {
        // A. Check for Combat End condition at a safe point in the loop.
        if (this._pendingCombatEndCheck) {
            this._pendingCombatEndCheck = false; // Reset flag immediately
            // Check if any hostile NPCs are left in the turn queue.
            const hostilesRemain = this.turnQueue.some((item: TurnQueueEntry) =>
                (item.entity instanceof Npc) && item.entity.disposition === 'hostile'
            );
            if (!hostilesRemain) {
                this.endCombat();
                return; // Exit combat flow entirely
            }
        }

        // B. End the previous actor's turn, if one existed.
        if (this.currentTurnIndex >= 0 && this.turnQueue[this.currentTurnIndex]) {
            const previousCombatant = this.turnQueue[this.currentTurnIndex];
            globalServiceLocator.eventBus.publish(GameEvents.COMBAT_TURN_END, { entity: previousCombatant });
        }

        // C. Advance the index to the next actor.
        this.currentTurnIndex++;

        // If we've completed a full round, reset the index and start a new round.
        if (this.currentTurnIndex >= this.turnQueue.length) {
            this.currentTurnIndex = 0;
            this.roundNumber++;
            console.log(`--- ROUND ${this.roundNumber} ---`);
            globalServiceLocator.eventBus.publish(GameEvents.COMBAT_ROUND_START, { roundNumber: this.roundNumber });
        }

        // This can happen if the last entity in the queue dies.
        if (!this.turnQueue[this.currentTurnIndex]) {
            // The combat end check at the start of the next advanceTurn call will handle this.
            return;
        }

        // D. Get the current actor.
        const currentActor: Entity = this.turnQueue[this.currentTurnIndex].entity;

        // E. Reset the actor's action budget for their new turn. Should be gotten from the actor prototype/template since it could have more actions of a given type
        currentActor.actionBudget = { standard: 1, move: 1, swift: 1, free: 99, hasTaken5FootStep: false, movementPoints: 30 };

        // F. Handle Action Denial (Stunned, Paralyzed, etc.).
        // TODO: Replace with a real status effect check, e.g., currentActor.hasStatus('stunned')
        const canAct = true; // Placeholder for future status effect system
        if (!canAct) {
            console.log(`${currentActor.name}'s turn is skipped.`);
            globalServiceLocator.eventBus.publish(GameEvents.COMBAT_TURN_SKIPPED, { entity: currentActor });
            await this.advanceTurn(); // Immediately proceed to a new turn
            return;
        }

        // G. Announce the start of the new turn.
        console.log(`Turn starts for: ${currentActor.name}`);
        globalServiceLocator.eventBus.publish(GameEvents.COMBAT_TURN_START, { entity: currentActor });

        // H. Delegate action based on actor type.
        if (currentActor instanceof PlayerCharacter) {
            // Wait for player input via PlayerTurnController.
        } else if (currentActor instanceof Npc && currentActor.aiPackage) {
            // AI decides, TurnManager executes.
            await this.handleNpcTurn(currentActor);
        } else {
            // Actor is NPC without AI or some other entity, auto-pass turn.
            this.processNpcAction(new PassTurnAction(currentActor));
            await this.advanceTurn(); // Auto-pass and advance for non-AI entities
        }
    }

    private async handleNpcTurn(npc: Npc) {
        while (npc.actionBudget.standard > 0 || npc.actionBudget.move > 0) {
            const action = npc.aiPackage.decideAction();

            if (action instanceof PassTurnAction || !this.canAfford(npc, action.cost)) {
                break;//ends the turn
            }

            // Await the completion of the action, including its render delay
            await this.processNpcAction(action);
        }

        // The NPC's turn is over, advance to the next combatant
        await this.advanceTurn();
    }

    /**
     * Executes an NPC's chosen action and immediately advances the turn.
     * This simple model (1 action -> end turn) can be expanded later.
     */
    public async processNpcAction(action: Action) {
        if (!action) return;

        // Deduct cost (future-proofing for multi-action NPCs)
        const budget = action.actor.actionBudget;
        switch (action.cost) {
            case ActionType.Standard: budget.standard--; break;
            case ActionType.Move: budget.move--; break;
            case ActionType.FullRound: budget.standard--; budget.move--; break;
            case ActionType.Swift: budget.swift--; break;
            case ActionType.Free: budget.free--; break;
        }

        // Execute the action's logic (which publishes events, etc.)
        action.execute();

        // Wait for a short duration to allow the UI to update and render the result.
        // This makes the NPC's actions feel sequential to the player.
        const RENDER_DELAY_MS = 150; // Tune this value for game feel
        await new Promise(resolve => setTimeout(resolve, RENDER_DELAY_MS));
    }

    /**
     * Checks if the current action budget can pay for a given action cost.
     */
    private canAfford(npc: Npc, cost: ActionType): boolean {
        // Outside of combat, actions are always affordable.
        if (!globalServiceLocator.turnManager.isCombatActive) return true;

        const budget = npc.actionBudget;
        if (!budget) return false;

        switch (cost) {
            case ActionType.Standard: return budget.standard > 0;
            case ActionType.Move: return budget.move > 0;
            case ActionType.FullRound: return budget.standard > 0 && budget.move > 0;
            case ActionType.Swift: return budget.swift > 0;
            case ActionType.Free: return budget.free > 0;
        }
    }

    private async removeEntityFromCombat(entityToRemove: Entity) {
        if (!this._isCombatActive) return;

        const index = this.turnQueue.findIndex(item => item.entity.id === entityToRemove.id);
        if (index > -1) {
            const removed = this.turnQueue.splice(index, 1);
            console.log(`${removed[0].entity.name} removed from combat queue.`);

            // If the removed entity was earlier in the queue than the current one,
            // we need to decrement the index to not skip a turn in this round.
            if (index < this.currentTurnIndex) {
                this.currentTurnIndex--;
            }
        }
    }

    public checkForCombatEnd(): void {
        if (!this._isCombatActive) return;

        const hostilesRemain = this.turnQueue.some((item: TurnQueueEntry) =>
            (item.entity instanceof Npc) && item.entity.disposition === 'hostile' && item.entity.isAlive()
        );

        if (!hostilesRemain) {
            this.endCombat();
        }
    }
}
