import { EntityID } from "../world.mjs";

/**
 * Defines the behavior and state of an AI-controlled entity.
 */
export class AIComponent {
    /**
     * A list of behavior scripts that determine the AI's decision-making process.
     * Example: ['aggressive_melee', 'fleer_when_low_health']
     */
    public behaviors: string[];

    /**
     * The current state of the AI, such as 'patrolling', 'attacking', or 'fleeing'.
     */
    public state: string;

    /**
     * The ID of the entity the AI is currently targeting.
     */
    public targetId: EntityID | null;

    constructor(behaviors: string[] = ['aggressive_melee'], initialState: string = 'idle', targetId: EntityID | null = null) {
        this.behaviors = behaviors;
        this.state = initialState;
        this.targetId = targetId;
    }
}
