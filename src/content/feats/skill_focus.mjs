/**
 * Logic for the Skill Focus feat.
 * This script will handle applying a +3 bonus to a chosen skill.
 * The actual choice of skill will be handled by the character creation UI,
 * which will pass the chosen skill to this effect's data.
 */
export default class SkillFocusEffectLogic {
    /**
     * @param {object} effect - The ActiveEffect instance this script is tied to.
     * @param {object} eventBus - The global game event bus.
     */
    constructor(effect, eventBus) {
        this.effect = effect;
        this.eventBus = eventBus;
        this.chosenSkill = effect.data.chosenSkill || null; // e.g., "Climb"

        this.modifySkillCheck = this.modifySkillCheck.bind(this);
    }

    /**
     * Called when the effect is applied.
     */
    onApply() {
        if (this.chosenSkill) {
            this.eventBus.subscribe('action:skill_check:before_roll', this.modifySkillCheck);
        } else {
            console.error("SkillFocus: No skill was chosen for this feat.");
        }
    }

    /**
     * Called when the effect is removed.
     */
    onRemove() {
        if (this.chosenSkill) {
            this.eventBus.unsubscribe('action:skill_check:before_roll', this.modifySkillCheck);
        }
    }

    /**
     * Modifies the skill check if it matches the chosen skill.
     * @param {object} context - The context object for the skill check.
     */
    modifySkillCheck(context) {
        if (context.actor === this.effect.target && context.skill === this.chosenSkill) {
            const skillFocusBonus = this.effect.bonuses.find(b => b.target.value === 'CHOICE');
            if (skillFocusBonus) {
                console.log(`Skill Focus (${this.chosenSkill}): Applying +${skillFocusBonus.value} bonus.`);
                context.roll.modifier += skillFocusBonus.value;
            }
        }
    }
}
