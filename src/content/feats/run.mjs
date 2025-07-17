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
        if (context.actor !== this.effect.target) return;

        console.log("Run feat: Modifying run action.");

        const actor = context.actor;
        const isHeavyArmor = actor.armor?.hasTag('heavy'); // Assuming armor has tags

        // Find the correct speed multiplier from the feat's bonuses
        const multiplierBonus = this.effect.bonuses.find(b => {
            if (b.applies_to !== 'run_speed_multiplier') return false;
            if (isHeavyArmor) {
                return b.condition.requires === 'armor_is_heavy';
            } else {
                return b.condition.requires === 'armor_is_not_heavy';
            }
        });

        if (multiplierBonus) {
            context.speed_multiplier = multiplierBonus.value;
        }

        // Check for retaining dex bonus
        const retainDexBonus = this.effect.bonuses.find(b => b.applies_to === 'retain_dex_bonus_while_running');
        if (retainDexBonus) {
            context.retain_dex_bonus = retainDexBonus.value;
        }
    }
}
