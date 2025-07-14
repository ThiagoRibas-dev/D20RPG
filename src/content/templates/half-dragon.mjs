/**
 * Companion script for the half-dragon.json template.
 * This handles the dynamic logic that can't be represented in pure data.
 */
import { globalServiceLocator } from '../../scripts/engine/serviceLocator.mjs';

/**
 * This function is called when the template is applied to an entity.
 * It's responsible for applying all the complex, conditional logic.
 *
 * @param {Entity} entity - The entity the template is being applied to.
 * @param {object} choices - The user's selections from the "choices" array in the JSON.
 *                           Example: { "dragon_variety": "red" }
 */
export function onApply(entity, choices) {
    const rules = globalServiceLocator.rulesEngine;

    // 1. Apply the chosen immunity based on dragon variety.
    const variety = choices.dragon_variety;
    const immunityTag = getImmunityForVariety(variety);
    if (immunityTag) {
        entity.tags.add(immunityTag);
    }

    // 2. Add the breath weapon special ability.
    // This is a complex ability, so we'll add it as an active effect
    // that points to a script for its execution logic.
    const breathWeaponEffect = {
        id: 'effect-half-dragon-breath-weapon',
        name: 'Breath Weapon',
        source: 'Half-Dragon Template',
        description: `A ${getBreathWeaponShape(variety)} of ${getBreathWeaponType(variety)} that deals 6d8 damage.`,
        script: 'special_abilities/half-dragon-breath.mjs', // We'll need to create this script
        context: {
            variety: variety,
            damage: '6d8',
            dc: 10 + Math.floor(entity.totalLevel / 2) + entity.stats.con, // Simplified DC for now
        },
        tags: ['special_ability', 'once_per_day']
    };
    entity.activeEffects.push(breathWeaponEffect);


    // 3. Add natural attacks (bite and claws).
    // We'll add these as modifiers that grant new attack options.
    // The actual logic for using them will be in the combat system.
    const size = entity.tags.has('size_large') ? 'large' : 'medium'; // Simplified size check
    const biteDamage = getNaturalAttackDamage(size, 'bite');
    const clawDamage = getNaturalAttackDamage(size, 'claw');

    rules.addModifier(entity, 'attacks.natural.bite', 1, 'untyped', 'Half-Dragon');
    rules.addModifier(entity, 'attacks.natural.claw', 2, 'untyped', 'Half-Dragon');
    // We'll also need to store the damage, which the modifier system doesn't do yet.
    // This is a good candidate for a future refactor. For now, we'll store it on the entity.
    if (!entity.naturalAttacks) entity.naturalAttacks = {};
    entity.naturalAttacks.bite = { damage: biteDamage };
    entity.naturalAttacks.claw = { damage: clawDamage };


    // 4. Adjust skill points.
    // (6 + Int mod) * (HD + 3). This is complex and requires knowing racial HD.
    // This is a good example of logic that MUST be in a script.
    const intMod = entity.stats.int;
    const racialHD = entity.selectedRace?.hit_dice || 1; // Simplified, assumes 1 racial HD
    const bonusSkillPoints = (6 + intMod) * (racialHD + 3);
    // We'll add these to the 'remaining' pool for the player to allocate.
    entity.skills.remaining += bonusSkillPoints;


    // 5. Handle wings for Large+ creatures.
    if (size === 'large') {
        const flySpeed = Math.min(entity.stats.speed * 2, 120);
        rules.addModifier(entity, 'speed.fly', flySpeed, 'racial', 'Half-Dragon Wings');
    }

    // The core engine will automatically handle the change in type to "dragon"
    // because of the "dragon" tag in the JSON.
}


// --- Helper Functions ---

function getImmunityForVariety(variety) {
    const immunities = {
        black: 'immunity_acid',
        blue: 'immunity_electricity',
        green: 'immunity_acid',
        red: 'immunity_fire',
        white: 'immunity_cold',
        brass: 'immunity_fire',
        bronze: 'immunity_electricity',
        copper: 'immunity_acid',
        gold: 'immunity_fire',
        silver: 'immunity_cold',
    };
    return immunities[variety];
}

function getBreathWeaponType(variety) {
    const types = {
        black: 'acid',
        blue: 'lightning',
        green: 'acid',
        red: 'fire',
        white: 'cold',
        brass: 'fire',
        bronze: 'lightning',
        copper: 'acid',
        gold: 'fire',
        silver: 'cold',
    };
    return types[variety];
}

function getBreathWeaponShape(variety) {
    const shapes = {
        black: '60-foot line',
        blue: '60-foot line',
        green: '30-foot cone',
        red: '30-foot cone',
        white: '30-foot cone',
        brass: '60-foot line',
        bronze: '60-foot line',
        copper: '60-foot line',
        gold: '30-foot cone',
        silver: '30-foot cone',
    };
    return shapes[variety];
}

function getNaturalAttackDamage(size, type) {
    const damageBySize = {
        medium: { bite: '1d6', claw: '1d4' },
        large: { bite: '1d8', claw: '1d6' },
    };
    return damageBySize[size]?.[type] || '1d4'; // Default to medium claw
}
