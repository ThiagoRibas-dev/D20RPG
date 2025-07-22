import { ActionData } from "./ecs/components/possibleActionsComponent.mjs";
import { EntityID } from "./ecs/world.mjs";

export class TargetingManager {
    public isTargeting: boolean = false;
    public action: ActionData | null = null;
    public validTargets: EntityID[] = [];

    public startTargeting(action: ActionData): void {
        this.isTargeting = true;
        this.action = action;
        // In a real implementation, we would calculate valid targets here.
        // For now, we'll just leave it empty.
        this.validTargets = [];
        console.log(`[TargetingManager] Started targeting for action: ${action.id}`);
    }

    public stopTargeting(): void {
        this.isTargeting = false;
        this.action = null;
        this.validTargets = [];
    }
}
