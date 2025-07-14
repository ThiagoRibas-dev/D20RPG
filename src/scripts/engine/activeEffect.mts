import { ContentItem } from "./entities/contentItem.mjs";
import { Entity } from "./entities/entity.mjs";

/**
 * Represents an instance of a temporary effect (like a buff or debuff)
 * that is currently active on an entity.
 */
export interface ActiveEffect {
    id: string;                      // A unique ID for this specific instance of the effect.
    name: string;                    // The display name of the effect, e.g., "Bless".
    source: string;                  // The source of the effect, e.g., "Bless Spell".
    description: string;             // The description of the effect.
    script: string;                  // The path to the effect's script.
    context: any;                    // The context for the effect's script.
    tags: string[];                  // The tags for the effect.
    sourceEffect: ContentItem;       // A reference to the original definition (JSON/script).

    target: Entity;                  // The entity this effect is applied to.
    caster?: Entity;                 // The entity that applied the effect, if any.

    durationInRounds: number;        // The total duration of the effect. 0 for permanent.
    remainingRounds: number;         // The countdown timer for the effect's duration.

    // Holds the instantiated logic class from the effect's companion script.
    scriptInstance: any;
}
