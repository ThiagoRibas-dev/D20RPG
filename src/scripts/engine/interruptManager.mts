import { Action } from "./actions/action.mjs";
import { MeleeAttackAction } from "./actions/meleeAttackAction.mjs";
import { Entity } from "./entities/entity.mjs";
import { Npc } from "./entities/npc.mjs";
import { PlayerCharacter } from "./entities/playerCharacter.mjs";
import { GameEvents } from "./events.mjs";
import { globalServiceLocator } from "./serviceLocator.mjs";

export interface Interrupt {
    triggeringEvent: (typeof GameEvents)[keyof typeof GameEvents];
    sourceEntity: Entity;
    potentialActions: Action[];
}

/**
 * Listens for game events that can trigger out-of-turn actions (interrupts)
 * and manages their resolution.
 */
export class InterruptManager {
    constructor() {
        globalServiceLocator.eventBus.subscribe(
            GameEvents.ACTION_PROVOKES_AOO,
            (event) => this.handleAoO(event.data)
        );
    }

    private handleAoO(data: { provokingActor: Entity, threateningActors: Entity[], continuationAction: Action }): void {
        const { provokingActor, threateningActors, continuationAction } = data;

        console.log(`InterruptManager: Caught AoO provocation by ${provokingActor.name}.`);

        const interruptActions: Action[] = [];

        for (const threat of threateningActors) {
            // TODO: Check if the threatening actor *can* make an AoO (e.g., not flat-footed, has AoOs left this round).
            const canMakeAoO = true; // Placeholder
            if (!canMakeAoO) {
                continue;
            }

            const weapon = threat.getEquippedWeapon(); // Assuming melee AoO for now
            const aooAction = new MeleeAttackAction(threat, provokingActor, weapon);
            interruptActions.push(aooAction);
        }

        // If there are any actual interrupts, handle them.
        if (interruptActions.length > 0) {
            // For now, we will assume NPCs always take the AoO and players are not yet prompted.
            // This logic will be expanded in the next steps.
            for (const action of interruptActions) {
                if (action.actor instanceof PlayerCharacter) {
                    // TODO: Prompt player
                    console.log(`Player has an opportunity to AoO ${provokingActor.name}, but is declining for now.`);
                } else {
                    console.log(`${action.actor.name} takes an AoO against ${provokingActor.name}.`);
                    globalServiceLocator.turnManager.addInterrupt(action);
                }
            }
        }

        // After queuing all interrupts, queue the original action that was interrupted.
        globalServiceLocator.turnManager.addInterrupt(continuationAction);
    }
}
