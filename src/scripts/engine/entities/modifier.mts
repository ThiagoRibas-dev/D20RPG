/**
 * Represents a single bonus or penalty.
 */
export interface Modifier {
    value: number;
    type: string; // "racial", "competence", "untyped", etc.
    target: string; // "stats.str", "ac", "saves.will", etc.
    source: string; // "Iron Will Feat", "Bless Spell", etc. etc.
    sourceId?: string; // The unique instance ID of the item or effect that applied this.
    duration?: number; // in rounds. undefined means permanent.
}

/**
 * A sophisticated list that holds all modifiers for a specific check
 * (e.g., "Will Save" or "Spot Skill"). It knows how to calculate the
 * final total based on D&D 3.5e stacking rules.
 */
export class ModifierList {
    private modifiers: Modifier[] = [];
    private modifierTypes: Map<string, any>;

    constructor(modifierTypes: Map<string, any>) {
        this.modifierTypes = modifierTypes;
    }

    public add(modifier: Modifier): void {
        this.modifiers.push(modifier);
    }

    /**
     * Removes all modifiers that came from a specific source instance (e.g., an unequpped item).
     * @param sourceId The unique ID of the source to remove.
     */
    public removeBySourceId(sourceId: string): void {
        this.modifiers = this.modifiers.filter(mod => mod.sourceId !== sourceId);
    }

    /**
     * Calculates the total bonus by applying stacking rules.
     */
    public getTotal(): number {
        const bestBonuses: { [type: string]: number } = {};
        let total = 0;

        for (const mod of this.modifiers) {
            const typeInfo = this.modifierTypes.get(mod.type);

            if (!typeInfo) {
                console.warn(`Unknown modifier type: ${mod.type}`);
                total += mod.value; // Treat unknown types as 'untyped'
                continue;
            }

            if (typeInfo.stacking === 'sum') {
                total += mod.value;
                continue;
            }

            // For typed bonuses that don't sum, find the best bonus and worst penalty.
            if (mod.value > 0) { // It's a bonus
                if (!bestBonuses[mod.type] || mod.value > bestBonuses[mod.type]) {
                    bestBonuses[mod.type] = mod.value;
                }
            } else { // It's a penalty
                if (!bestBonuses[mod.type] || mod.value < bestBonuses[mod.type]) {
                    bestBonuses[mod.type] = mod.value;
                }
            }
        }

        // Add the best of each typed bonus to the total.
        for (const type in bestBonuses) {
            total += bestBonuses[type];
        }

        return total;
    }

    /**
     * Gets the most restrictive (lowest) value from all modifiers in this list.
     * Useful for things like Max Dexterity Bonus from armor.
     * @returns The lowest value, or a default high number if no modifiers exist.
     */
    public getLowest(): number {
        if (this.modifiers.length === 0) {
            return 99; // A high default, effectively meaning "no limit".
        }
        return Math.min(...this.modifiers.map(mod => mod.value));
    }
}
