import { globalServiceLocator } from "../serviceLocator.mjs";
import { rollD20 } from "../utils.mjs";
import { OpposedCheckAction } from "./opposedCheckAction.mjs";
import { Point } from "../../utils/point.mjs";
import { EntityID, World } from "../ecs/world.mjs";
import { ActionBudgetComponent, FeatsComponent, IdentityComponent, TagsComponent } from "../ecs/components/index.mjs";

export class StartGrappleAction extends OpposedCheckAction {
    public readonly id = 'start_grapple';
    public readonly name = 'Start Grapple';
    public readonly description = 'Attempt to grab and hold an opponent.';

    constructor(actor: EntityID) {
        super(actor);
        const feats = globalServiceLocator.world.getComponent(actor, FeatsComponent);
        if (feats?.feats.includes('feat:improved_grapple')) {
            this.provokesAoO = false;
        }
    }

    public canExecute(world: World): boolean {
        // This is a simplified check. In a real game, we'd check for adjacent enemies.
        // For now, we assume the UI will only show this action for valid targets.
        return super.canExecute(world);
    }

    public async execute(world: World, target?: EntityID | Point): Promise<void> {
        if (typeof target !== 'string') {
            console.error("Grapple action requires a valid entity target.");
            return;
        }

        // Step 2 (from plan): Melee Touch Attack before the opposed check
        const touchAttackRoll = rollD20() + await globalServiceLocator.modifierManager.queryStat(this.actor, 'attack');
        const targetTouchAC = await globalServiceLocator.modifierManager.queryStat(target, 'ac_touch');

        const actorIdentity = world.getComponent(this.actor, IdentityComponent);
        const targetIdentity = world.getComponent(target, IdentityComponent);

        if (touchAttackRoll < targetTouchAC) {
            globalServiceLocator.feedback.addMessageToLog(`${actorIdentity?.name} fails to grab ${targetIdentity?.name}.`, 'orange');
            const budget = world.getComponent(this.actor, ActionBudgetComponent);
            if (budget) {
                budget.standardActions--;
            }
            return;
        }

        // If touch attack hits, proceed with the standard opposed check flow
        await super.execute(world, target);
    }

    protected async resolveOpposedCheck(world: World, actor: EntityID, target: EntityID): Promise<boolean> {
        const actorGrappleBonus = await globalServiceLocator.modifierManager.queryStat(actor, 'grapple');
        const targetGrappleBonus = await globalServiceLocator.modifierManager.queryStat(target, 'grapple');

        const actorRoll = rollD20() + actorGrappleBonus;
        const targetRoll = rollD20() + targetGrappleBonus;

        return actorRoll >= targetRoll;
    }

    protected onSuccess(world: World, target: EntityID): void {
        const actorIdentity = world.getComponent(this.actor, IdentityComponent);
        const targetIdentity = world.getComponent(target, IdentityComponent);
        globalServiceLocator.feedback.addMessageToLog(`${actorIdentity?.name} successfully grapples ${targetIdentity?.name}!`, 'green');
        
        const actorTags = world.getComponent(this.actor, TagsComponent);
        if (actorTags) {
            actorTags.tags.add('status:grappling');
        }

        const targetTags = world.getComponent(target, TagsComponent);
        if (targetTags) {
            targetTags.tags.add('status:grappling');
        }
    }

    protected onFailure(world: World, target: EntityID): void {
        const actorIdentity = world.getComponent(this.actor, IdentityComponent);
        const targetIdentity = world.getComponent(target, IdentityComponent);
        globalServiceLocator.feedback.addMessageToLog(`${actorIdentity?.name} fails to hold ${targetIdentity?.name}.`, 'orange');
    }
}
