export interface Action {
    // Every action must have an execute method.
    execute(): void;
}