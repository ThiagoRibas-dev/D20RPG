// src/scripts/engine/entities/gameState.mts
import { ContentItem } from "./contentItem.mjs";
import { Entity } from "./entity.mjs";
import { PlayerCharacter } from "./playerCharacter.mjs";

export type GameState = {
    creationSteps: string[];
    currentScreen: string;
    player: PlayerCharacter | null;
    creationStep: number;
    currentMapData: any;
    monsters: Entity[];
    npcs: Entity[];
    currentCampaignData: ContentItem | null;
};