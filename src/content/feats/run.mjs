/**
 * Logic for the Run feat.
 * This script modifies the movement speed multiplier for the run action
 * and ensures the character retains their Dexterity bonus to AC.
 */
export default class RunEffectLogic {
    /**
     * @param {object} effect - The ActiveEffect instance this script is tied to.
     * @param {object} eventBus - The global game event bus.
     */
    constructor(effect, eventBus) {
        this.effect = effect;
        this.eventBus = eventBus;

        this.modifyRunAction = this.modifyRunAction.bind(this);
    }

    /**
     * Called when the effect is applied.
     */
    onApply() {
        this.eventBus.subscribe('action:run:before_execute', this.modifyRunAction);
    }

    /**
     * Called when the effect is removed.
     */
    onRemove() {
        this.eventBus.unsubscribe('action:run:before_execute', this.modifyRunAction);
    }

    /**
     * Modifies the run action context.
     * @param {object} context - The context object for the run action.
     */
    modifyRunAction(context) {
        if (context.actor === this.effect.target) {
            console.log("Run feat: Modifying run action.");
            // The engine will need to check for heavy armor or heavy load.
            // This script just signals that the feat is active.
            context.runFeatActive = true;
        }
    }
}
