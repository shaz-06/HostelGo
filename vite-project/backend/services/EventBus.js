const EventEmitter = require("events");

class LocalEventBus {
  constructor() {
    this.emitter = new EventEmitter();
    this.processedEventIds = new Set(); // Simple in-memory event idempotency cache
  }

  /**
   * Subscribes a handler callback to a specific event type.
   */
  subscribe(eventType, handler) {
    this.emitter.on(eventType, async (eventPayload) => {
      try {
        const { eventId } = eventPayload;
        
        // Enforce event idempotency: skip duplicate processing
        if (eventId && this.processedEventIds.has(eventId)) {
          console.warn(`[EventBus] Ignored duplicate eventId: ${eventId}`);
          return;
        }

        if (eventId) {
          this.processedEventIds.add(eventId);
          // Keep processed events buffer small
          if (this.processedEventIds.size > 10000) {
            const firstAdded = Array.from(this.processedEventIds)[0];
            this.processedEventIds.delete(firstAdded);
          }
        }

        await handler(eventPayload);
      } catch (err) {
        console.error(`[EventBus] Handler error for ${eventType}:`, err);
      }
    });
  }

  /**
   * Publishes an event to all subscribers.
   */
  publish(eventType, eventPayload) {
    // Perform standard payload validations
    if (!eventPayload.eventId || !eventPayload.correlationId) {
      console.warn("[EventBus] Event payload lacks eventId or correlationId:", eventPayload);
    }
    
    // Defer execution using setImmediate to ensure asynchronous publishing
    setImmediate(() => {
      this.emitter.emit(eventType, eventPayload);
    });
  }
}

const EventBus = new LocalEventBus();
module.exports = EventBus;
