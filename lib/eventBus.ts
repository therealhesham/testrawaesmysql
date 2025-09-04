import { EventEmitter } from "events";

const eventBus = global.eventBus || new EventEmitter();

if (!global.eventBus) {
  global.eventBus = eventBus;
}

export default eventBus;
