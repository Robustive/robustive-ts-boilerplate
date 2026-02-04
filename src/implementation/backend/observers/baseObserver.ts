import { EventBus, EventMap, EventType, Unsubscribe } from "@backend/eventBus";

export abstract class BaseObserver<T extends EventType, E extends EventMap[T]> {
  protected readonly unsubscribers: {
    [C in E["case"]]?: Unsubscribe
  } = {}

  abstract on<C extends E["case"]>(
    type: C,
    handler: (e: Extract<E, { case: C }>) => void
  ): Unsubscribe

  abstract register(): void

  unsubscribe<C extends E["case"]>(type: C) {
    this.unsubscribers[type]?.()
    delete this.unsubscribers[type]
  }

  unsubscribeAll() {
    Object.keys(this.unsubscribers).forEach(type => this.unsubscribe(type as E["case"]))
  }
}