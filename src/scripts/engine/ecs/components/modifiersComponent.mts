import { Modifier } from '../../entities/modifier.mjs';

/**
 * A component that holds all active modifiers for an entity.
 */
export class ModifiersComponent {
    constructor(public modifiers: Modifier[] = []) {}
}
