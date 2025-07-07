import { Action } from "./actions/action.mjs";
import { Entity } from "./entities/entity.mjs";
import { EventBus } from "./eventBus.mjs";
import { globalServiceLocator } from "./serviceLocator.mjs";

/**
 * Manages the flow of combat, including turn order, initiative, and round tracking.
 * It publishes events to notify other systems about the state of combat.
 */
export class TurnManager {
    private turnQueue: Entity[] = [];
    private currentTurnIndex: number = -1;
    private roundNumber: number = 0;
    private _isCombatActive: boolean = false;

    public get isCombatActive(): boolean { return this._isCombatActive; } // Public getter

    constructor() {
        console.log("TurnManager initialized.");
        // We can add subscriptions here later if needed, e.g., to listen for character death.
        globalServiceLocator.eventBus.subscribe('character:died', (data: { entity: Entity }) => this.removeEntityFromCombat(data.entity));
    }

    /**
     * Kicks off a combat encounter.
     * @param combatants An array of all entities participating in the combat.
     */
    public startCombat(combatants: Entity[]): void {
        if (this._isCombatActive || combatants.length === 0) {
            console.warn("Combat is already active or no combatants provided.");
            return;
        }

        this._isCombatActive = true;
        this.roundNumber = 1;

        // 1. Roll initiative for all combatants
        const initiativeList = combatants.map(entity => ({
            entity,
            initiative: entity.rollInitiative()
        }));

        // 2. Sort combatants by initiative (descending)
        initiativeList.sort((a, b) => b.initiative - a.initiative);
        this.turnQueue = initiativeList.map(item => item.entity);

        // 3. Publish the start of combat
        console.log("--- COMBAT STARTED ---");
        console.log("Turn Order:", this.turnQueue.map(e => e.name));
        globalServiceLocator.eventBus.publish('combat:start', { combatants: this.turnQueue });

        // 4. Start the first turn
        this.currentTurnIndex = -1; // Will be incremented to 0 in advanceTurn
        this.advanceTurn();
    }

    /**
     * Advances the turn to the next entity in the queue.
     */
    public advanceTurn(): void {
        // 1. Give every NPC a turn.
        globalServiceLocator.state.npcs.forEach(npc => {
            npc.aiPackage?.decideAndExecuteAction();
        });

        // 2. Reset the player's action budget for their new turn.
        const player = globalServiceLocator.state.player;
        if (player) {
            player.actionBudget = { standard: 1, move: 1, swift: 1, free: 5, hasTaken5FootStep: false };
        }

        // 3. If in combat mode, advance the initiative queue.
        if (this._isCombatActive) {
            // It will eventually publish 'combat:turn:start' again.
            const eventBus: EventBus = globalServiceLocator.eventBus;
            // Publish end of the previous turn, if there was one
            if (this.currentTurnIndex >= 0) {
                const previousCombatant = this.turnQueue[this.currentTurnIndex];
                eventBus.publish('combat:turn:end', { entity: previousCombatant });
            }

            this.currentTurnIndex++;

            // Check for end of round
            if (this.currentTurnIndex >= this.turnQueue.length) {
                this.currentTurnIndex = 0;
                this.roundNumber++;
                console.log(`--- ROUND ${this.roundNumber} ---`);
                eventBus.publish('combat:round:start', { roundNumber: this.roundNumber });
            }

            // Start the new turn
            const currentCombatant = this.turnQueue[this.currentTurnIndex];
            console.log(`Turn starts for: ${currentCombatant.name}`);
            eventBus.publish('combat:turn:start', { entity: currentCombatant });
        }
    }

    /**
     * Ends the current combat encounter.
     */
    public endCombat(): void {
        if (!this._isCombatActive) return;

        console.log("--- COMBAT ENDED ---");
        const eventBus: EventBus = globalServiceLocator.eventBus;
        eventBus.publish('combat:end', { result: 'ended' }); // Add more data later (victory/defeat)

        // Reset state
        this._isCombatActive = false;
        this.turnQueue = [];
        this.currentTurnIndex = -1;
        this.roundNumber = 0;
    }

    /**
     * Removes a specific entity from the turn queue (e.g., on death).
     * @param entityToRemove The entity to remove.
     */
    private removeEntityFromCombat(entityToRemove: Entity): void {
        if (!this._isCombatActive) return;

        const index = this.turnQueue.findIndex(e => e.id === entityToRemove.id);
        if (index > -1) {
            this.turnQueue.splice(index, 1);
            // If the removed entity was earlier in the queue than the current one,
            // we need to decrement the index to not skip a turn.
            if (index < this.currentTurnIndex) {
                this.currentTurnIndex--;
            }
            console.log(`${entityToRemove.name} removed from combat.`);
        }
    }

    /**
     * Entry point for an NPC to perform an action.
     * It executes the action and then immediately advances the turn,
     * as our current AI model is simple (one action per turn).
     */
    public performNpcAction(action: Action): void {
        if (!this._isCombatActive) return;

        console.log(`TurnManager processing NPC action for ${action.actor.name}`);
        action.execute();

        // Since our AI is simple for now, we advance the turn right after.
        // A more complex AI might submit multiple actions.
        this.advanceTurn();
    }
}