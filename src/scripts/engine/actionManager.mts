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
import { EntityID } from "./ecs/world.mjs";
import { TagsComponent, ClassComponent } from "./ecs/components/index.mjs";

// A list of all available action classes in the game.
const ALL_ACTIONS: (new (actor: EntityID, ...args: any[]) => Action)[] = [
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

const GRAPPLE_ACTIONS: (new (actor: EntityID, ...args: any[]) => Action)[] = [
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
     * @param actorId The entity whose actions are being requested.
     * @returns A list of valid, instantiated Action objects.
     */
    public getAvailableActions(actorId: EntityID): Action[] {
        const availableActions: Action[] = [];
        let actionList: (new (actor: EntityID, ...args: any[]) => Action)[];

        const world = globalServiceLocator.world;
        const tagsComponent = world.getComponent(actorId, TagsComponent);

        if (tagsComponent && tagsComponent.tags.has('status:grappling')) {
            actionList = GRAPPLE_ACTIONS;
        } else {
            actionList = ALL_ACTIONS;
        }

        // 1. Instantiate and check all general actions.
        actionList.forEach(ActionClass => {
            const actionInstance = new (ActionClass as any)(actorId);
            if (actionInstance.canExecute()) {
                availableActions.push(actionInstance);
            }
        });

        // 2. Check for specific, context-dependent actions like using powers.
        const powers = this.getActorPowers(actorId);
        powers.forEach(async (power) => {
            if (power && power.get) {
                const powerData = await power.get();
                if (powerData) {
                    const usePowerAction = new UsePowerAction(actorId, powerData.id);
                    if (usePowerAction.canExecute(world)) {
                        availableActions.push(usePowerAction);
                    }
                }
            }
        });

        return availableActions;
    }

    private getActorPowers(actorId: EntityID): ContentItem[] {
        const world = globalServiceLocator.world;
        const classComponent = world.getComponent(actorId, ClassComponent);
        
        if (classComponent) {
            // This is still simplified. A full implementation would check the power system
            // defined in the class data from the content files.
            const isMagicUser = classComponent.classes.some(c => c.classId === 'cleric' || c.classId === 'wizard'); // Example check
            if (isMagicUser) {
                return Object.values(globalServiceLocator.contentLoader.contentData['spells'] || {}).filter(v => v instanceof ContentItem);
            }
        }
        return [];
    }
}
