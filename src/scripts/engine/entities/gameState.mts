import { PlayerCharacter } from "./playercharacter.mjs";

export type GameState = {
    currentScreen: string;
    player: PlayerCharacter;
    campaign: string;
    creationStep: number;
};