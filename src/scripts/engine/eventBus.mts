import { GameEvent } from "./events.mjs";

type Listener = (event: GameEvent) => void;

interface PrioritizedListener {
    callback: Listener;
    priority: number;
}

/**
 * A sophisticated, global event bus for decoupling game systems.
 * Systems can publish events and other systems can subscribe to them
 * without direct dependencies on each other.
 */
export class EventBus {
    private listeners: Map<string, PrioritizedListener[]> = new Map();

    /**
     * Subscribes a callback function to a specific event.
     * @param eventName The event to listen for (e.g., 'combat:start').
     * @param callback The function to execute when the event is published.
     * @param priority The priority of the listener. Lower numbers execute first.
     */
    public subscribe(eventName: string, callback: Listener, priority: number = 0) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, []);
        }
        const listeners = this.listeners.get(eventName)!;
        listeners.push({ callback, priority });
        listeners.sort((a, b) => a.priority - b.priority);
    }

    /**
     * Unsubscribes a callback function from a specific event.
     * This is crucial for cleanup when an object is destroyed or an effect ends.
     * @param eventName The event to stop listening to.
     * @param callback The specific function that was subscribed.
     */
    public unsubscribe(eventName: string, callback: Listener) {
        if (!this.listeners.has(eventName)) {
            return;
        }

        const eventListeners = this.listeners.get(eventName)!;
        const index = eventListeners.findIndex(listener => listener.callback === callback);
        if (index > -1) {
            eventListeners.splice(index, 1);
        }
    }

    /**
     * Publishes an event, triggering all subscribed callbacks.
     * @param eventName The event to publish.
     * @param data Optional data to pass to the listeners.
     */
    public publish(eventName: string, data?: any) {
        if (!this.listeners.has(eventName)) {
            return; // No one is listening, so do nothing.
        }

        const gameEvent = new GameEvent(eventName, data);
        const eventListeners = this.listeners.get(eventName)!;

        // Call every listener for this event, passing the data.
        for (const listener of eventListeners) {
            if (gameEvent.isCancelled) {
                break; // Stop processing if the event was cancelled.
            }
            try {
                listener.callback(gameEvent);
            } catch (error) {
                console.error(`Error in event listener for "${eventName}":`, error);
            }
        }
    }
}
