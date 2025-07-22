import { Component } from "../world.mjs";

export class IdentityComponent implements Component {
    public raceId: string = '';
    constructor(public name: string, public description: string = "") {}
}
