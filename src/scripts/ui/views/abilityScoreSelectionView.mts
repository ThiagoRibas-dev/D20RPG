import { globalServiceLocator } from '../../engine/serviceLocator.mjs';
import { calculateModifier, getRandomInt } from '../../engine/utils.mjs';
import { AttributesComponent, IdentityComponent } from '../../engine/ecs/components/index.mjs';

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

        for (const key in this.scoreInputs) {
            this.scoreInputs[key].onchange = () => this.updateDisplay();
        }

        const rollButton = this.container.querySelector('#roll-ability-scores') as HTMLElement;
        if (rollButton) {
            rollButton.onclick = () => this.rollAbilities();
        }
    }

    public render(): void {
        this.updateDisplay();
    }

    public async updateDisplay(): Promise<void> {
        const playerId = globalServiceLocator.state.playerId;
        if (!playerId) return;

        this.saveAbilities(); // Save the current input values first

        // Recalculate all stats to reflect the new base attributes
        await globalServiceLocator.statCalculationSystem.recalculateStats(playerId, globalServiceLocator.world);

        const ui = globalServiceLocator.ui;
        const currentPoints = this.calculateCurrentPoints();
        ui.els["remainingPointsDisplay"].textContent = (this.pointBuyTotal - currentPoints).toString();

        for (const key in this.scoreInputs) {
            const input = this.scoreInputs[key];
            const baseValue = parseInt(input.value) || 0;

            const finalValue = await globalServiceLocator.modifierManager.queryStat(playerId, key);

            ui.els[`${key}-cost`].innerText = this.pointBuyCost(baseValue).toString();
            ui.els[`${key}-mod`].innerText = calculateModifier(finalValue).toString();
            ui.els[`${key}-total`].innerText = `${finalValue}`;
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
        if (score <= 18) return (score - 14) * 2 + 6;
        return 999;
    }

    private rollAbilities(): void {
        for (const key in this.scoreInputs) {
            this.scoreInputs[key].value = (getRandomInt(1, 6) + getRandomInt(1, 6) + getRandomInt(1, 6)).toString();
        }
        this.updateDisplay();
    }

    public saveAbilities(): void {
        const playerId = globalServiceLocator.state.playerId;
        if (!playerId) return;

        const attributes = globalServiceLocator.world.getComponent(playerId, AttributesComponent);
        console.log('saveAbilities');
        console.table(attributes || []);
        if (!attributes) return;

        for (const key in this.scoreInputs) {
            const value = parseInt(this.scoreInputs[key].value, 10);
            console.log(`setting ${value} to ${key}`);
            attributes.attributes.set(key, value);
        }
    }

    public show(): void { this.container.style.display = ''; }
    public hide(): void { this.container.style.display = 'none'; }
}
