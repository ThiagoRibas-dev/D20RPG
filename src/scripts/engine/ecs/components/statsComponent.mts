import { Component } from './component.mjs';

export class StatsComponent extends Component {
    [key: string]: number | undefined;

    constructor(initialStats: { [key: string]: number } = {}) {
        super();
        Object.assign(this, initialStats);
    }
}
