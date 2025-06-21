import { ContentItem } from "./contentItem.mjs";
import { Npc } from "./npc.mjs";
import { PlayerCharacter } from "./playerCharacter.mjs";

export type GameState = {
    creationSteps: string[];
    currentScreen: string;
    player: PlayerCharacter | null;
    creationStep: number;
    currentMapData: any;
    npcs: Npc[];
    currentCampaignData: ContentItem | null;
    currentTurn: string;
};