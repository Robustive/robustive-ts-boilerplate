import { SwiftEnum, SwiftEnumCases } from "@robustive/robustive-ts";
import { UserActivityEvent } from "./observers/userActivityObserver";

export type EventContext = {
  userActivity: { e: UserActivityEvent }
  // notification: { e: NotificationEvent }
}

export const Event = new SwiftEnum<EventContext>()
export type Event = SwiftEnumCases<EventContext>

export type EventType = Event["case"]
type EventHandler<E extends { case: PropertyKey }> = (event: E) => Promise<void> | void
type SubEventOf<T extends EventType> = Extract<Event, { case: T }> extends { e: infer P extends { case: PropertyKey } } ? P : never
export type EventMap = {
  [T in EventType]: SubEventOf<T>
}
type SubEventHandlers<T extends EventType> = {
  [C in EventMap[T]["case"]]: Array<EventHandler<Extract<EventMap[T], { case: C }>>>
}

export type Unsubscribe = () => void

export type EventBus = {
  [T in EventType]: {
    on: <C extends EventMap[T]["case"]>(type: C, handler: EventHandler<Extract<EventMap[T], { case: C }>>) => Unsubscribe
    emit: <C extends EventMap[T]["case"]>(event: Extract<EventMap[T], { case: C }>) => void
  }
}

export const EventBus = class _EventBus {
  static #singleton: EventBus

  private constructor() {
    const handlers: Partial<{
      [T in EventType]: Partial<SubEventHandlers<T>>
    }> = {}

    return new Proxy(this, {
      get<T extends EventType>(target, prop: T, receiver) { // prop = EventType
        return ((typeof prop === "string") && !(prop in target))
          ? {
            on: <C extends EventMap[T]["case"]>(type: C, handler: EventHandler<Extract<EventMap[T], { case: C }>>): Unsubscribe => {
              const map = (handlers[prop] ??= {}) as SubEventHandlers<T>
              const list = map[type] ??= []
              list.push(handler)

              // unsubscribe
              return () => {
                const idx = list.indexOf(handler)
                if (idx >= 0) list.splice(idx, 1)
              }
            },
            emit: <C extends EventMap[T]["case"]>(event: Extract<EventMap[T], { case: C }>): void => {
              const map = handlers[prop] as SubEventHandlers<T>
              const list = map?.[event.case]
              list?.forEach(handler => handler(event))
            }
          }
          : Reflect.get(target, prop, receiver)
      }
    })
  }

  static get shared() {
    return this.#singleton ??= new _EventBus() as EventBus
  }
}