import { Modifier, ModifierList } from "./entities/modifier.mjs";

/**
 * Manages all ModifierLists for a single entity.
 * This class encapsulates the logic for adding, retrieving, and removing modifiers across all stats.
 */
export class ModifierManager {
    private lists: Map<string, ModifierList> = new Map();

    /**
     * Adds a modifier to the correct list.
     * @param target The stat being modified (e.g., "ac", "saves.will").
     * @param modifier The modifier to add.
     */
    public add(target: string, modifier: Modifier): void {
        if (!this.lists.has(target)) {
            this.lists.set(target, new ModifierList());
        }
        this.lists.get(target)!.add(modifier);
    }

    /**
     * Retrieves a specific ModifierList.
     * @param target The stat list to get (e.g., "ac").
     * @returns The ModifierList, or undefined if it doesn't exist.
     */
    public get(target: string): ModifierList | undefined {
        return this.lists.get(target);
    }

    /**
     * Removes all modifiers originating from a specific source ID across all lists.
     * This is the key function for unequipping items.
     * @param sourceId The unique ID of the source to remove modifiers from.
     */
    public removeBySourceId(sourceId: string): void {
        for (const list of this.lists.values()) {
            list.removeBySourceId(sourceId);
        }
    }

    /**
     * Clears all modifiers from all lists. Used when recalculating stats from scratch.
     */
    public clear(): void {
        this.lists.clear();
    }
}