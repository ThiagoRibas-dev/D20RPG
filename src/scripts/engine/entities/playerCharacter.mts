import { ContentItem } from "./contentItem.mjs";

export class PlayerCharacter {
    public selectedRace: ContentItem | null;
    public selectedClass: ContentItem | null;
    public stats: {};
    public level: number;

    constructor() {
        this.selectedRace = null
        this.selectedClass = null
        this.stats = {};
        this.level = 1
    }
};