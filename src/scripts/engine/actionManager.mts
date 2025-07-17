import { Entity } from "./entities/entity.mjs";
import { UsePowerAction } from "./actions/usePowerAction.mjs";
import { globalServiceLocator } from "./serviceLocator.mjs";
import { ContentItem } from "./entities/contentItem.mjs";

import { Action } from "./actions/action.mjs";
import { MoveAction } from "./actions/moveAction.mjs";
import { TotalDefenseAction } from "./actions/totalDefenseAction.mjs";
import { AidAnotherAction } from "./actions/aidAnotherAction.mjs";
import { WithdrawAction } from "./actions/withdrawAction.mjs";
import { ReadyAction } from "./actions/readyAction.mjs";
import { ChargeAction } from "./actions/chargeAction.mjs";
import { FeintAction } from "./actions/feintAction.mjs";
import { TripAction } from "./actions/tripAction.mjs";
import { DisarmAction } from "./actions/disarmAction.mjs";
import { BullRushAction } from "./actions/bullRushAction.mjs";
import { StartGrappleAction } from "./actions/startGrappleAction.mjs";
import { DamageOpponentAction } from "./actions/damageOpponentAction.mjs";
import { PinAction } from "./actions/pinAction.mjs";
import { EscapeGrappleAction } from "./actions/escapeGrappleAction.mjs";

// A list of all available action classes in the game.
const ALL_ACTIONS: (new (actor: Entity, ...args: any[]) => Action)[] = [
    TotalDefenseAction,
    AidAnotherAction,
    WithdrawAction,
    ReadyAction,
    ChargeAction,
    FeintAction,
    TripAction,
    DisarmAction,
    BullRushAction,
    StartGrappleAction,
];

const GRAPPLE_ACTIONS: (new (actor: Entity, ...args: any[]) => Action)[] = [
    DamageOpponentAction,
    PinAction,
    EscapeGrappleAction,
];

export class ActionManager {
    constructor() {
        // The ActionManager might need to subscribe to events in the future,
        // e.g., to invalidate actions when the game state changes.
    }

    /**
     * Retrieves a list of all possible actions an entity can currently take.
     * @param actor The entity whose actions are being requested.
     * @returns A list of valid, instantiated Action objects.
     */
    public getAvailableActions(actor: Entity): Action[] {
        const availableActions: Action[] = [];
        let actionList: (new (actor: Entity, ...args: any[]) => Action)[];

        if (actor.hasTag('status:grappling')) {
            actionList = GRAPPLE_ACTIONS;
        } else {
            actionList = ALL_ACTIONS;
        }

        // 1. Instantiate and check all general actions.
        actionList.forEach(ActionClass => {
            const actionInstance = new (ActionClass as any)(actor);
            if (actionInstance.canExecute()) {
                availableActions.push(actionInstance);
            }
        });

        // 2. Check for specific, context-dependent actions like using powers.
        // This part will need to be expanded significantly.
        // For now, let's assume we can get a list of the actor's powers.
        const powers = this.getActorPowers(actor);
        powers.forEach(power => {
            const usePowerAction = new UsePowerAction(actor, power);
            if (usePowerAction.canExecute()) {
                availableActions.push(usePowerAction);
            }
        });

        return availableActions;
    }

    // This is a placeholder. A real implementation would need to look
    // at the character's class, spellbook, etc.
    private getActorPowers(actor: Entity): ContentItem[] {
        // This is a very simplified example.
        // In a real game, you would check class spell lists, prepared spells, etc.
        if (actor.powerSystem === 'magic') {
            // The actual ContentItem objects are nested, so we need to extract them.
            return Object.values(globalServiceLocator.contentLoader.contentData['spells'] || {}).filter(v => v instanceof ContentItem);
        }
        return [];
    }
}
