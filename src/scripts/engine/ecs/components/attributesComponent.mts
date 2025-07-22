import { Component } from "../world.mjs";

export class AttributesComponent implements Component {
    constructor(public attributes: Map<string, number> = new Map()) {}
}
