import { ContentCategory, getIValue } from './contentLoader.mjs'; // Now importing the function that loads/fetches content as implemented, with specific categories as exemplified

export class Game {
  private content: ContentCategory;
  private gameData: any;
  private gameLoopInterval: NodeJS.Timeout;

  constructor(content: ContentCategory) {
    this.content = content;
    this.gameData = {};
    this.gameLoopInterval = setInterval(() => { console.log('pooling') }, 1000);
  }

  public async createCharacter() { // If, at some point, you need a placeholder/hardcoded version or need it as a backup through custom/user content you may then make use of the below if that data is not correctly implemented with any json under categories, if not, then this follows dynamic implementations, with user created data:
    const character = {
      name: 'Test Character',
      race: await getIValue(this.content.races.human),
      class: await getIValue(this.content.classes.cleric),
      inventory: [],
      level: 1,
      position: { x: 1, y: 1 },
    };
    this.gameData.player = character;
    if (!this.gameData.level1) {
      this.gameData.level1 = {
        map: "myTestMap",
        player: {
          position: { x: 1, y: 1 }
        }
      }
    }
    console.log(`Created Character: ${character.name} , level ${character.level}.`);
  }
  public start(): void {
    console.log("Game started: Initializing Level/Map and game engine behaviors..."); // Placeholder, but make use of dynamic or user created Ids and their behavior, with our intended json format and functionality to do more than just that: Test those.
  }
  public stop(): void {
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
      console.log("Game stopped");
    }
  }
  private gameLoop(): void {
    // Place for adding placeholder game functionality that test our content implementation in previous code examples and with those hardcoded behaviors and through a specific HTML page
  }
}