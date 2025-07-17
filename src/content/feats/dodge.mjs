/**
 * Logic for the Dodge feat.
 * This script handles the dynamic selection of an opponent to gain an AC bonus against.
 */
export default class DodgeEffectLogic {
    /**
     * @param {object} effect - The ActiveEffect instance this script is tied to.
     * @param {object} eventBus - The global game event bus.
     */
    constructor(effect, eventBus) {
        this.effect = effect;
        this.eventBus = eventBus;
        this.designatedOpponent = null;

        // Bind 'this' context for all listener methods.
        this.designateOpponent = this.designateOpponent.bind(this);
        this.applyDodgeBonus = this.applyDodgeBonus.bind(this);
    }

    /**
     * Called when the effect is applied.
     */
    onApply() {
        // When an entity attacks, they automatically designate that target for Dodge.
        this.eventBus.subscribe('action:attack:before_roll', this.designateOpponent);
        // We also need to listen for attacks against the feat owner.
        this.eventBus.subscribe('action:attack:before_roll', this.applyDodgeBonus);
    }

    /**
     * Called when the effect is removed.
     */
    onRemove() {
        this.eventBus.unsubscribe('action:attack:before_roll', this.designateOpponent);
        this.eventBus.unsubscribe('action:attack:before_roll', this.applyDodgeBonus);
    }

    /**
     * Designates an opponent when the feat owner attacks.
     * @param {object} context - The context object for the attack action.
     */
    designateOpponent(context) {
        // Only trigger when the owner of this feat is the one attacking.
        if (context.attacker === this.effect.target) {
            if (this.designatedOpponent !== context.target) {
                console.log(`Dodge: Designating ${context.target.name} as opponent.`);
                this.designatedOpponent = context.target;
            }
        }
    }

    /**
     * Applies the dodge bonus if the attacker is the designated opponent.
     * @param {object} context - The context object for the attack action.
     */
    applyDodgeBonus(context) {
        // Only apply if the feat owner is the one being attacked by the designated opponent.
        if (context.target === this.effect.target && context.attacker === this.designatedOpponent) {
            console.log(`Dodge: Applying +1 dodge bonus to AC against ${context.attacker.name}.`);
            // The ModifierManager should handle adding this to the AC calculation.
            // For now, we'll add it directly to the context for the RulesEngine to process.
            const dodgeBonus = this.effect.bonuses.find(b => b.condition.requires === 'attacker_is_designated_opponent');
            if (dodgeBonus) {
                context.ac.bonuses.push({
                    type: dodgeBonus.type,
                    value: dodgeBonus.value,
                    source: 'Dodge Feat'
                });
            }
        }
    }
}
