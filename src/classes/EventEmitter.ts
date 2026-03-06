import type { GameEvent } from '../types';

type Handler<T = unknown> = (payload: T) => void;

export class EventEmitter {
  private listeners = new Map<GameEvent, Handler[]>();

  on<T>(event: GameEvent, handler: Handler<T>): void {
    const list = this.listeners.get(event) ?? [];
    list.push(handler as Handler);
    this.listeners.set(event, list);
  }

  off<T>(event: GameEvent, handler: Handler<T>): void {
    const list = this.listeners.get(event) ?? [];
    this.listeners.set(event, list.filter(h => h !== handler));
  }

  emit<T>(event: GameEvent, payload?: T): void {
    const list = this.listeners.get(event) ?? [];
    list.forEach(h => h(payload));
  }
}
