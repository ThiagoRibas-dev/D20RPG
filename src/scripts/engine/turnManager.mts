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
    private isCombatActive: boolean = false;

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
        if (this.isCombatActive || combatants.length === 0) {
            console.warn("Combat is already active or no combatants provided.");
            return;
        }

        this.isCombatActive = true;
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
        if (!this.isCombatActive) return;

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

    /**
     * Ends the current combat encounter.
     */
    public endCombat(): void {
        if (!this.isCombatActive) return;

        console.log("--- COMBAT ENDED ---");
        const eventBus: EventBus = globalServiceLocator.eventBus;
        eventBus.publish('combat:end', { result: 'ended' }); // Add more data later (victory/defeat)

        // Reset state
        this.isCombatActive = false;
        this.turnQueue = [];
        this.currentTurnIndex = -1;
        this.roundNumber = 0;
    }

    /**
     * Removes a specific entity from the turn queue (e.g., on death).
     * @param entityToRemove The entity to remove.
     */
    private removeEntityFromCombat(entityToRemove: Entity): void {
        if (!this.isCombatActive) return;

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

    // File to Modify: src/scripts/engine/turnManager.mts
    public performAction(action: Action): void {
        if (!this.isCombatActive /* || check if it's the correct entity's turn */) {
            return;
        }
        action.execute();

        // After the action is done, advance the turn.
        // (A real system would manage Action Points and wait for an "End Turn" action)
        this.advanceTurn();
    }
}