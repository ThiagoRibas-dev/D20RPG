import { ContentItem } from "./contentItem.mjs";

export type PlayerCharacter = {
    selectedRace: ContentItem | null;
    selectedClass: ContentItem | null;
    stats: { [key: string]: number };
    level: number;

};