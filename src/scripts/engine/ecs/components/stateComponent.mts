import { Component } from "../world.mjs";

export class StateComponent implements Component {
    constructor(public states: Map<string, any> = new Map()) {}
}
