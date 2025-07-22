import { Action } from '../../actions/action.mjs';
import { EntityID } from '../world.mjs';

export class ReadyActionComponent {
    constructor(public trigger: string, public action: Action, public target?: EntityID) {}
}
