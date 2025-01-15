import { PlayerCharacter } from "./playerCharacter.mjs";

export type GameState = {
    currentScreen: string;
    player: PlayerCharacter;
    campaign: string;
    creationStep: number;
};