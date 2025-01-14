import { ContentItem } from "./contentItem.mjs";

export class PlayerCharacter {
    public selectedRace: ContentItem | null;
    public selectedClass: ContentItem | null;
    public stats: { [key: string]: number };
    public level: number;

    constructor() {
        this.selectedRace = null;
        this.selectedClass = null;
        this.stats = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
        this.level = 1
    }
};