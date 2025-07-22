import { AttributesComponent, EquipmentComponent, IdentityComponent, ItemComponent } from "../../../scripts/engine/ecs/components/index.mjs";
import { ModifierManager } from "../../../scripts/engine/modifierManager.mjs";
import { globalServiceLocator } from "../../../scripts/engine/serviceLocator.mjs";
import { getRandomInt, rollDice } from "../../../scripts/engine/utils.mjs";

export async function execute(world, actorId, targetId) {
    const actorIdentity = world.getComponent(actorId, IdentityComponent);
    const targetIdentity = world.getComponent(targetId, IdentityComponent);
    const actorName = actorIdentity ? actorIdentity.name : `Entity ${actorId}`;
    const targetName = targetIdentity ? targetIdentity.name : `Entity ${targetId}`;

    console.log(`[Action] ${actorName} is attempting to melee attack ${targetName}`);

    // 1. Perform the Attack Roll
    const attackRoll = getRandomInt(1, 20);
    const attackBonus = await ModifierManager.queryStat(actorId, 'attack_bonus'); // Generic attack bonus
    const totalAttack = attackRoll + attackBonus;

    // 2. Get the Target's AC
    const targetAc = await ModifierManager.queryStat(targetId, 'ac', {
        excludedTags: ['is_flat_footed', 'is_touch_attack']
    });

    console.log(`[Action] ${actorName} rolls a ${attackRoll} + ${attackBonus} bonus = ${totalAttack} vs. AC ${targetAc}`);

    // 3. Compare and Apply Damage
    if (totalAttack >= targetAc) {
        console.log(`[Action] Hit!`);

        // 3a. Calculate Weapon Damage
        let weaponDamage = 0;
        const equipment = world.getComponent(actorId, EquipmentComponent);
        const weaponId = equipment?.slots.get('main_hand');
        if (weaponId) {
            const itemComp = world.getComponent(weaponId, ItemComponent);
            if (itemComp && itemComp.damage) {
                weaponDamage = rollDice(itemComp.damage).total;
            }
        } else {
            // Unarmed strike
            weaponDamage = rollDice("1d3").total;
        }

        // 3b. Calculate Damage Bonus
        const damageBonus = await ModifierManager.queryStat(actorId, 'damage_bonus');
        const totalDamage = Math.max(1, weaponDamage + damageBonus); // Minimum 1 damage

        // 3c. Apply Damage
        const targetAttributes = world.getComponent(targetId, AttributesComponent);
        if (targetAttributes) {
            const currentHp = targetAttributes.attributes.get('hp_current') || 0;
            const newHp = currentHp - totalDamage;
            targetAttributes.attributes.set('hp_current', newHp);
            console.log(`[Action] Dealt ${totalDamage} damage to ${targetName}. New HP: ${newHp}`);
            globalServiceLocator.eventBus.publish('entity:took_damage', { entityId: targetId, damage: totalDamage });

            if (newHp <= 0) {
                console.log(`[Action] ${targetName} has been defeated!`);
                globalServiceLocator.eventBus.publish('entity:died', { entityId: targetId });
            }
        }
    } else {
        console.log(`[Action] Miss!`);
    }
}
