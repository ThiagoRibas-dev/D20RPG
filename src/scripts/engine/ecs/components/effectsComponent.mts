import { ActiveEffect } from '../../effectManager.mjs';

/**
 * A component that holds all temporary, active effects applied to an entity.
 */
export class EffectsComponent {
    constructor(public activeEffects: ActiveEffect[] = []) {}
}
