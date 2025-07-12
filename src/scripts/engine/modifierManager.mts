import { Modifier, ModifierList } from "./entities/modifier.mjs";
import { globalServiceLocator } from "./serviceLocator.mjs";

/**
 * Manages all modifiers for a single entity, applying layering and stacking rules.
 */
export class ModifierManager {
    public modifierTypes: Map<string, any> = new Map(); // Initialize to an empty Map

    constructor() {
        this.loadModifierTypes();
    }

    private async loadModifierTypes(): Promise<void> {
        try {
            const data = await globalServiceLocator.contentLoader.loadModifierTypes();
            this.modifierTypes = new Map(data.map((type: any) => [type.id, type]));
        } catch (error) {
            console.error("Failed to load modifier types:", error);
            this.modifierTypes = new Map(); // Initialize as empty map on error
        }
    }

    // Layer 1: Persistent modifiers from equipment, feats, etc.
    private persistentModifiers: Modifier[] = [];
    
    // Layer 2: Temporary modifiers from spells, conditions, etc.
    private temporaryModifiers: Modifier[] = [];

    /**
     * Adds a modifier to the appropriate layer.
     * @param modifier The modifier to add.
     */
    public add(modifier: Modifier): void {
        if (modifier.duration === undefined) {
            this.persistentModifiers.push(modifier);
        } else {
            this.temporaryModifiers.push(modifier);
        }
    }

    /**
     * Removes all modifiers from a specific source.
     * @param sourceId The unique ID of the source to remove modifiers from.
     */
    public removeBySourceId(sourceId: string): void {
        this.persistentModifiers = this.persistentModifiers.filter(mod => mod.sourceId !== sourceId);
        this.temporaryModifiers = this.temporaryModifiers.filter(mod => mod.sourceId !== sourceId);
    }

    /**
     * Advances the game turn, ticking down the duration of temporary modifiers.
     */
    public tick(): void {
        this.temporaryModifiers = this.temporaryModifiers.filter(mod => {
            if (mod.duration !== undefined) {
                mod.duration--;
                return mod.duration > 0;
            }
            return true;
        });
    }

    /**
     * Calculates the final value for a given target (e.g., "ac", "stats.str").
     * @param target The target to get the value for.
     * @param baseValue The inherent, base value of the target.
     * @returns The final calculated value.
     */
    public getValue(target: string, baseValue: number): number {
        // Ensure modifierTypes is loaded before creating ModifierList
        if (!this.modifierTypes) {
            console.warn("Modifier types not loaded yet. Returning base value.");
            return baseValue;
        }
        const list = new ModifierList(this.modifierTypes);

        // In a more complete implementation, we would apply base stats first.
        // For now, we'll just add all modifiers to one list.
        // The layering logic will be fully implemented when we integrate this
        // with the character and game state.

        for (const mod of this.persistentModifiers) {
            if (mod.target === target) {
                list.add(mod);
            }
        }

        for (const mod of this.temporaryModifiers) {
            if (mod.target === target) {
                list.add(mod);
            }
        }

        return baseValue + list.getTotal();
    }
}
