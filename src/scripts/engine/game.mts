
export class Game {
  private gameLoopInterval: NodeJS.Timeout;

  constructor() {
    this.gameLoopInterval = setInterval(() => { console.log('pooling') }, 1000);
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