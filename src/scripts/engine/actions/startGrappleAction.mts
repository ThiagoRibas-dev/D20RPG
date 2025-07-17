import { globalServiceLocator } from "../serviceLocator.mjs";
import { Entity } from "../entities/entity.mjs";
import { GameEvents } from "../events.mjs";
import { calculateModifier, rollD20 } from "../utils.mjs";
import { OpposedCheckAction } from "./opposedCheckAction.mjs";
import { Point } from "../../utils/point.mjs";

export class StartGrappleAction extends OpposedCheckAction {
    public readonly id = 'start_grapple';
    public readonly name = 'Start Grapple';
    public readonly description = 'Attempt to grab and hold an opponent.';

    constructor(actor: Entity) {
        super(actor);
        if (this.actor.hasTag('feat:improved_grapple')) {
            this.provokesAoO = false;
        }
    }

    public canExecute(): boolean {
        // This is a simplified check. In a real game, we'd check for adjacent enemies.
        // For now, we assume the UI will only show this action for valid targets.
        return super.canExecute();
    }

    public async execute(target?: Entity | Point): Promise<void> {
        if (!(target instanceof Entity)) {
            console.error("Grapple action requires a valid entity target.");
            return;
        }

        // Step 2 (from plan): Melee Touch Attack before the opposed check
        const touchAttackRoll = rollD20() + this.actor.baseAttackBonus + calculateModifier(this.actor.getAbilityScore('str'));
        const targetTouchAC = target.getArmorClass(); // Simplified: should be touch AC

        if (touchAttackRoll < targetTouchAC) {
            globalServiceLocator.feedback.addMessageToLog(`${this.actor.name} fails to grab ${target.name}.`, 'orange');
            this.actor.actionBudget.standard -= 1; // Consume the action
            return;
        }

        // If touch attack hits, proceed with the standard opposed check flow
        await super.execute(target);
    }

    protected async resolveOpposedCheck(actor: Entity, target: Entity): Promise<boolean> {
        const actorGrappleBonus = actor.baseAttackBonus + calculateModifier(actor.getAbilityScore('str')) + globalServiceLocator.rulesEngine.getGrappleCheckModifier(actor);
        const targetGrappleBonus = target.baseAttackBonus + calculateModifier(target.getAbilityScore('str')) + globalServiceLocator.rulesEngine.getGrappleCheckModifier(target);

        const actorRoll = rollD20() + actorGrappleBonus;
        const targetRoll = rollD20() + targetGrappleBonus;

        return actorRoll >= targetRoll;
    }

    protected onSuccess(target: Entity): void {
        globalServiceLocator.feedback.addMessageToLog(`${this.actor.name} successfully grapples ${target.name}!`, 'green');
        this.actor.tags.add('status:grappling');
        target.tags.add('status:grappling');
        // Future: Add a more robust grappling state management system
    }

    protected onFailure(target: Entity): void {
        globalServiceLocator.feedback.addMessageToLog(`${this.actor.name} fails to hold ${target.name}.`, 'orange');
    }
}
