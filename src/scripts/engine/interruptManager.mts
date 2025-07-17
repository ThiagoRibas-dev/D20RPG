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

export interface ReadiedAction {
    actor: Entity;
    trigger: string;
    action: Action | null;
}

/**
 * Listens for game events that can trigger out-of-turn actions (interrupts)
 * and manages their resolution.
 */
export class InterruptManager {
    private readiedActions: ReadiedAction[] = [];

    constructor() {
        globalServiceLocator.eventBus.subscribe(
            GameEvents.ACTION_PROVOKES_AOO,
            (event) => this.handleAoO(event.data)
        );

        // A generic listener for all events to check for readied action triggers.
        // This is not very efficient, but it's the simplest way to implement this for now.
        globalServiceLocator.eventBus.subscribe('*', (event) => this.checkReadiedActions(event.name));
    }

    public add(readiedAction: ReadiedAction): void {
        this.readiedActions.push(readiedAction);
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

    private checkReadiedActions(eventName: string): void {
        const triggered: ReadiedAction[] = [];

        for (const readied of this.readiedActions) {
            // This is a very simple trigger check. A real implementation would
            // need a more robust way to define and check triggers.
            if (readied.trigger === eventName) {
                triggered.push(readied);
            }
        }

        for (const readied of triggered) {
            if (readied.action) {
                console.log(`${readied.actor.name}'s readied action is triggered by ${eventName}!`);
                globalServiceLocator.turnManager.addInterrupt(readied.action);
            }
            // Remove the readied action once it has been triggered.
            const index = this.readiedActions.indexOf(readied);
            if (index > -1) {
                this.readiedActions.splice(index, 1);
            }
        }
    }
}
