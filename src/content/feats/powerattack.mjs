/**
 * Logic for the Power Attack feat.
 * This file is loaded dynamically by the engine at runtime.
 * It must export a default class that the EffectManager can instantiate.
 */
export default class PowerAttackEffectLogic {
    /**
     * @param {object} effect - The ActiveEffect instance this script is tied to.
     * @param {object} eventBus - The global game event bus.
     */
    constructor(effect, eventBus) {
        this.effect = effect;
        this.eventBus = eventBus;

        // Bind 'this' context for all listener methods.
        this.modifyAttack = this.modifyAttack.bind(this);
        this.modifyDamage = this.modifyDamage.bind(this);
    }

    /**
     * Called when the effect is applied. This is where we subscribe to game events.
     */
    onApply() {
        // A permanent feat like this is "applied" when the character is created.
        this.eventBus.subscribe('action:attack:before_roll', this.modifyAttack);
        this.eventBus.subscribe('action:damage:before_roll', this.modifyDamage);
    }

    /**
     * Called when the effect is removed. This is where we clean up our event subscriptions.
     */
    onRemove() {
        this.eventBus.unsubscribe('action:attack:before_roll', this.modifyAttack);
        this.eventBus.unsubscribe('action:damage:before_roll', this.modifyDamage);
    }

    /**
     * Listener for the 'action:attack:before_roll' event.
     * @param {object} context - The context object for the attack action.
     */
    modifyAttack(context) {
        // Only apply to the owner of this effect.
        if (context.attacker !== this.effect.target) return;

        // In a real game, this would come from a UI prompt.
        // For now, we'll hardcode a value.
        const chosenPenalty = 2; // Let's use 2 for this example.

        if (chosenPenalty > 0) {
            console.log(`Power Attack: Applying -${chosenPenalty} to attack roll.`);
            context.attackRoll.modifier -= chosenPenalty;

            // Store the chosen penalty in the context object so other listeners
            // (like our modifyDamage method) can access it during the same action.
            context.powerAttackValue = chosenPenalty;
        }
    }

    /**
     * Listener for the 'action:damage:before_roll' event.
     * @param {object} context - The context object for the damage action.
     */
    modifyDamage(context) {
        // Check if our modifyAttack listener ran and set the value.
        if (context.attacker !== this.effect.target || !context.powerAttackValue) return;

        let damageBonus = context.powerAttackValue;

        // A real weapon object would have this property.
        if (context.weapon.isTwoHanded) {
            damageBonus *= 2;
        }

        console.log(`Power Attack: Applying +${damageBonus} to damage roll.`);
        context.damageRoll.bonus += damageBonus;
    }
}