import { ContentItem } from '../../engine/entities/contentItem.mjs';
import { globalServiceLocator } from '../../engine/serviceLocator.mjs';
import { EntityAbilityScores } from '../../engine/entities/entity.mjs';
import { calculateModifier, getRandomInt } from '../../engine/utils.mjs';

/**
 * Manages the UI and logic for the ability score selection step of character creation.
 */
export class AbilityScoreSelectionView {
    private container: HTMLElement;
    private scoreInputs: { [key: string]: HTMLInputElement };
    private pointBuyTotal = 32;

    constructor() {
        const ui = globalServiceLocator.ui;
        this.container = ui.els['ability-score-selection'];
        this.scoreInputs = {
            str: ui.inputs.str,
            dex: ui.inputs.dex,
            con: ui.inputs.con,
            int: ui.inputs.int,
            wis: ui.inputs.wis,
            cha: ui.inputs.cha,
        };

        // --- THIS IS THE CRITICAL FIX ---
        // We set up the listeners here, directly in the class constructor.
        // This makes the View fully responsible for its own events.
        for (const key in this.scoreInputs) {
            this.scoreInputs[key].onchange = () => this.updateDisplay();
        }

        // Add event listeners to the buttons on this view
        (this.container.querySelector('#roll-ability-scores') as HTMLElement).onclick = () => this.rollAbilities();
    }

    /**
     * Initializes the view, setting initial values and updating displays.
     */
    public render(): void {
        this.updateDisplay();
    }

    /**
     * Updates all UI elements related to ability scores (totals, mods, costs).
     * This function now fully replaces the old updateAbilityScoreDisplay.
     */
    public updateDisplay(): void {
        const player = globalServiceLocator.state.player;
        if (!player) return;

        // Ensure a race is selected to prevent errors with racial mods.
        if (!player.selectedRace) {
            console.warn("No race selected, cannot calculate final ability scores.");
            // Maybe prompt the user to go back? For now, we'll proceed with 0 mods.
        }

        const ui = globalServiceLocator.ui;
        const currentPoints = this.calculateCurrentPoints();
        ui.els["remainingPointsDisplay"].textContent = (this.pointBuyTotal - currentPoints).toString();

        for (const key in this.scoreInputs) {
            const ability = key as keyof EntityAbilityScores;
            const input = this.scoreInputs[ability];
            const baseValue = parseInt(input.value) || 0;

            const racialMod = player.selectedRace?.ability_score_adjustments?.[ability] || 0;
            const finalValue = baseValue + racialMod;

            ui.els[`${ability}-cost`].innerText = this.pointBuyCost(baseValue).toString();
            ui.els[`${ability}-mod`].innerText = calculateModifier(finalValue).toString();
            ui.els[`${ability}-total`].innerText = `${finalValue} (${baseValue} + ${racialMod})`;
        }
    }

    private calculateCurrentPoints(): number {
        let total = 0;
        for (const key in this.scoreInputs) {
            total += this.pointBuyCost(parseInt(this.scoreInputs[key].value, 10));
        }
        return total;
    }

    private pointBuyCost(score: number): number {
        if (score <= 8) return 0;
        if (score <= 13) return score - 8;
        if (score <= 18) return (score - 14) * 2 + 6; // D&D 3.5 point buy cost is different, but this is a placeholder.
        return 999; // Should not happen with input max=18
    }

    private rollAbilities(): void {
        for (const key in this.scoreInputs) {
            this.scoreInputs[key].value = (getRandomInt(1, 6) + getRandomInt(1, 6) + getRandomInt(1, 6)).toString();
        }
        this.updateDisplay(); // Update display after rolling
    }

    public saveAbilities(): void {
        const player = globalServiceLocator.state.player;
        if (!player) return;

        // 1. Save the chosen scores to baseStats
        for (const key in this.scoreInputs) {
            const ability = key as keyof EntityAbilityScores;
            player.baseStats[ability] = parseInt(this.scoreInputs[key].value, 10);
        }

        // 2. Calculate final stats by applying racial modifiers
        for (const key in player.baseStats) {
            const ability = key as keyof EntityAbilityScores;
            const racialMod = player.selectedRace?.ability_score_adjustments?.[ability] || 0;
            player.stats[ability] = player.baseStats[ability] + racialMod;
        }

        // Now that stats are set, recalculate everything.
        player.recalculateDerivedStats();
    }

    public show(): void { this.container.style.display = ''; }
    public hide(): void { this.container.style.display = 'none'; }
}
