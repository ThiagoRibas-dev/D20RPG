/**
 * This script is executed when the Human race is applied to a character.
 * It grants the single bonus feat that humans receive at 1st level.
 */
export default class HumanBonusFeat {
    /**
     * @param {object} ability - The ability context provided by the engine.
     * @param {Entity} ability.target - The entity (the character) to whom the ability is being applied.
     */
    constructor(ability) {
        const target = ability.target;
        if (!target) {
            console.error("HumanBonusFeat script was executed without a target entity.");
            return;
        }

        console.log(`Applying Human Bonus Feat to ${target.name}.`);

        // Add a modifier to the 'feats.max' stat. The feat selection UI will
        // read this value to determine how many feats the player can select.
        target.modifiers.add(
            'feats.max',
            {
                value: 1,
                type: 'racial',
                source: 'Human Bonus Feat',
                target: 'feats.max'
            }
        );
    }
}
