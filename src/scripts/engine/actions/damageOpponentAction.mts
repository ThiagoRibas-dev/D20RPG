import { globalServiceLocator } from "../serviceLocator.mjs";
import { Entity } from "../entities/entity.mjs";
import { OpposedCheckAction } from "./opposedCheckAction.mjs";
import { calculateModifier, rollD20 } from "../utils.mjs";
import { Point } from "../../utils/point.mjs";

export class DamageOpponentAction extends OpposedCheckAction {
    public readonly id = 'damage_opponent';
    public readonly name = 'Damage Opponent';
    public readonly description = 'Deal damage to an opponent you are grappling.';

    constructor(actor: Entity) {
        super(actor);
    }

    public canExecute(): boolean {
        return this.actor.hasTag('status:grappling') && super.canExecute();
    }

    protected async resolveOpposedCheck(actor: Entity, target: Entity): Promise<boolean> {
        const actorGrappleBonus = actor.baseAttackBonus + calculateModifier(actor.getAbilityScore('str')) + globalServiceLocator.rulesEngine.getGrappleCheckModifier(actor);
        const targetGrappleBonus = target.baseAttackBonus + calculateModifier(target.getAbilityScore('str')) + globalServiceLocator.rulesEngine.getGrappleCheckModifier(target);

        const actorRoll = rollD20() + actorGrappleBonus;
        const targetRoll = rollD20() + targetGrappleBonus;

        return actorRoll >= targetRoll;
    }

    protected onSuccess(target: Entity): void {
        // Simplified damage - should be based on unarmed strike
        const damage = Math.max(1, 1 + calculateModifier(this.actor.getAbilityScore('str')));
        globalServiceLocator.feedback.addMessageToLog(`${this.actor.name} damages ${target.name} for ${damage} points!`, 'green');
        target.takeDamage(damage, this.actor);
    }

    protected onFailure(target: Entity): void {
        globalServiceLocator.feedback.addMessageToLog(`${this.actor.name} fails to damage ${target.name}.`, 'orange');
    }
}
