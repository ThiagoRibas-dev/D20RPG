// src/scripts/engine/entities/gameState.mts
import { ContentItem } from "./contentItem.mjs";
import { PlayerCharacter } from "./playerCharacter.mjs";

export type GameState = {
    creationSteps: string[];
    currentScreen: string;
    player: PlayerCharacter | null; 
    creationStep: number;
    currentMapData: any;
    monsters: any[];
    npcs: any[];
    currentCampaignData: ContentItem | null;
};