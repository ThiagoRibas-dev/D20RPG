import { Component } from "../world.mjs";

export class TagsComponent implements Component {
    constructor(public tags: Set<string> = new Set()) {}
}
