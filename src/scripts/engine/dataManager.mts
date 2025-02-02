// src/scripts/engine/dataManager.mts
import { GAME_STATE } from "../index.mjs";
import { UIHolder } from "./entities/uiHolder.mjs";
import { getRandomInt } from "./utils.mjs";

export function rollAbilities(uiScreens: UIHolder) {
    const asEl = getElAbilityScores(uiScreens);
    asEl.str.value = roll3d6().toString();
    asEl.dex.value = roll3d6().toString();
    asEl.con.value = roll3d6().toString();
    asEl.int.value = roll3d6().toString();
    asEl.wis.value = roll3d6().toString();
    asEl.cha.value = roll3d6().toString();
    updateAbilityScoreDisplay(uiScreens);
}

function roll3d6(): number {
    let roll = 0
    for (let i = 0; i < 3; i++) {
        roll += getRandomInt(1, 6)
    }
    return roll;
}

export function saveAbilities(uiScreens: UIHolder) {
    const asEl = getElAbilityScores(uiScreens);
    const player = GAME_STATE.player;
    if (!player) {
        console.log("Player is not initialized");
        return;
    }

    player.stats = {
        str: parseInt(asEl.str.value, 10),
        dex: parseInt(asEl.dex.value, 10),
        con: parseInt(asEl.con.value, 10),
        int: parseInt(asEl.int.value, 10),
        wis: parseInt(asEl.wis.value, 10),
        cha: parseInt(asEl.cha.value, 10),
    };

    // Initialize hit points if first save
    if (player.hitPoints.max === 0) {
        player.hitPoints = calculateBaseHitPoints();
    }
}

export function saveSkills(uiScreens: UIHolder) {
    const player = GAME_STATE.player;
    if (!player) {
        console.log("Player is not initialized");
        return;
    }

    const skillInputs = Array.from(
        uiScreens.els['skill-container'].querySelectorAll('input[type="number"]')
    ) as HTMLInputElement[];

    const newAllocations = new Map<string, number>();
    skillInputs.forEach(input => {
        const skillId = input.id.replace('-skill', '');
        const value = parseFloat(input.value) || 0;
        newAllocations.set(skillId, value);
    });

    player.skillPoints.allocations = newAllocations;
}

// New helper function
function calculateBaseHitPoints(): { current: number; max: number } {
    const player = GAME_STATE.player;
    if (!player) {
        console.log("Player is not initialized");
        return { current: 0, max: 0 };
    }

    let total = 0;
    player.classes.forEach(cls => {
        const conMod = calcMod(player.stats.con);
        total += Math.max(1, cls.hitDice + conMod);
    });
    return { current: total, max: total };
}

// Update ability modifier calculation
export function calcMod(finalValue: number): number {
    return Math.floor((finalValue - 10) / 2);
}

export function getElAbilityScores(uiScreens: UIHolder): { [key: string]: HTMLInputElement } {
    return {
        str: uiScreens.inputs.str,
        dex: uiScreens.inputs.dex,
        con: uiScreens.inputs.con,
        int: uiScreens.inputs.int,
        wis: uiScreens.inputs.wis,
        cha: uiScreens.inputs.cha,
    };
}

export function calculateCurrentAbilityPoints(el: { [key: string]: HTMLInputElement }): number {
    let total = 0;
    Object.values(el).forEach((value, i) => {
        if (i < Object.values(el).length - 1) { total += pointBuyCost(parseInt(value.value)) };
    })
    return total;
}

export function pointBuyCost(roll: number) {
    let cost = 0;
    if (roll > 18) {
        cost += (roll - 18) * 3;
        roll = 18;
    }
    if (roll > 13) {
        cost += (roll - 13) * 2;
        roll = 13;
    }
    if (roll > 8) {
        cost += (roll - 8);
    }
    return cost;
}

export function updateAbilityScoreDisplay(UI: UIHolder) {
    const player = GAME_STATE.player;
    if (!player) {
        console.log("Player is not initialized");
        return;
    }

    const asEl: { [key: string]: HTMLInputElement } = getElAbilityScores(UI)
    const totalPoints: number = 32;
    const remainingPointsDisplay = UI.els["remainingPointsDisplay"];
    const currentTotal = calculateCurrentAbilityPoints(asEl)

    remainingPointsDisplay.textContent = (totalPoints - currentTotal).toString();
    Object.keys(asEl).map(ability => {
        const baseValue = parseInt(asEl[ability].value) || 0;

        const racialMod = player.selectedRace?.ability_score_adjustments[ability] || 0;
        const finalValue = baseValue + (racialMod);

        const costDisplay = UI.els[`${ability}-cost`];
        const modDisplay = UI.els[`${ability}-mod`];
        const finalDisplay = UI.els[`${ability}-total`];

        costDisplay.innerText = pointBuyCost(baseValue).toString();
        modDisplay.innerText = calcMod(finalValue).toString();
        finalDisplay.innerText = `${finalValue} (${baseValue}+${racialMod})`;
    });
}

/**
 * Calculates effective skill ranks for checks/display
 * @param skillId - ID from content/skills
 * @returns Effective ranks (including cross-class penalties)
 */
export function getSkillRank(skillId: string): number {
    const player = GAME_STATE.player;
    if (!player) {
        console.log("Player is not initialized");
        return 0;
    }

    const pointsSpent = player.skillPoints.allocations.get(skillId) || 0;
    const isClassSkill = player.classes.some(cls =>
        cls.classSkills.includes(skillId)
    );
    return isClassSkill ? pointsSpent : pointsSpent / 2;
}