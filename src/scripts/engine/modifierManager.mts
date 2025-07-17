import { Modifier, ModifierList } from "./entities/modifier.mjs";
import { globalServiceLocator } from "./serviceLocator.mjs";
import { calculateModifier } from "./utils.mjs";

/**
 * Manages all modifiers for a single entity, applying layering and stacking rules.
 */
export class ModifierManager {
    public modifierTypes: Map<string, any>;

    constructor(modifierTypes: any[]) {
        this.modifierTypes = new Map(modifierTypes.map((type: any) => [type.id, type]));
    }

    // A cache that groups all modifiers by their target for faster lookups.
    private _modifiersByTarget: Map<string, Modifier[]> = new Map();

    /**
     * Adds a modifier and updates the cache.
     * @param modifier The modifier to add.
     */
    public add(modifier: Modifier): void {
        const target = modifier.target;
        if (!this._modifiersByTarget.has(target)) {
            this._modifiersByTarget.set(target, []);
        }
        this._modifiersByTarget.get(target)!.push(modifier);
    }

    /**
     * Removes all modifiers from a specific source and rebuilds the cache.
     * @param sourceId The unique ID of the source to remove modifiers from.
     */
    public removeBySourceId(sourceId: string): void {
        for (const [target, mods] of this._modifiersByTarget.entries()) {
            const filteredMods = mods.filter(mod => mod.sourceId !== sourceId);
            if (filteredMods.length === 0) {
                this._modifiersByTarget.delete(target);
            } else {
                this._modifiersByTarget.set(target, filteredMods);
            }
        }
    }

    /**
     * Advances the game turn, ticking down the duration of temporary modifiers.
     */
    public tick(): void {
        for (const [target, mods] of this._modifiersByTarget.entries()) {
            const updatedMods = mods.filter(mod => {
                if (mod.duration !== undefined && mod.duration > 0) {
                    mod.duration--;
                    return mod.duration > 0;
                }
                // Keep permanent mods or mods that haven't expired
                return mod.duration === undefined || mod.duration > 0;
            });

            if (updatedMods.length < mods.length) {
                 if (updatedMods.length === 0) {
                    this._modifiersByTarget.delete(target);
                } else {
                    this._modifiersByTarget.set(target, updatedMods);
                }
            }
        }
    }

    /**
     * Calculates the final value for a given target (e.g., "ac", "stats.str").
     * @param target The target to get the value for.
     * @param baseValue The inherent, base value of the target.
     * @returns The final calculated value.
     */
    public getValue(target: string, baseValue: number, entity: any): number {
        const list = new ModifierList(this.modifierTypes);
        const mods = this._modifiersByTarget.get(target);

        if (mods) {
            for (const mod of mods) {
                list.add(mod);
            }
        }

        // Special case for Armor Class, which has complex dependencies.
        if (target === 'ac') {
            const dexMod = calculateModifier(entity.getAbilityScore('dex'));
            
            // Get max dex bonus from armor, which is a modifier on 'ac.max_dex'
            const maxDexList = new ModifierList(this.modifierTypes);
            const maxDexMods = this._modifiersByTarget.get('ac.max_dex');
            if (maxDexMods) {
                for (const mod of maxDexMods) {
                    maxDexList.add(mod);
                }
            }
            const maxDex = maxDexList.getLowest();
            const cappedDexMod = Math.min(dexMod, maxDex);

            return baseValue + cappedDexMod + list.getTotal();
        }

        return baseValue + list.getTotal();
    }
}
