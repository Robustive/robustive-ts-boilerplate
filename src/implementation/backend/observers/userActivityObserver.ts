import { EventBus, Unsubscribe } from "@backend/eventBus";
import { UserCommand } from "@dependencies/postgres/repositories/users/userCommand";
import { SwiftEnum, SwiftEnumCases } from "@robustive/robustive-ts";
import { BaseObserver } from "./baseObserver";
import { UserId } from "@domain/models/authentication/type";

export type UserActivityEventContext = {
  signUp: { userId: UserId }
  signIn: { userId: UserId }
  signOut: { userId: UserId }
}

export const UserActivityEvent = new SwiftEnum<UserActivityEventContext>()
export type UserActivityEvent = SwiftEnumCases<UserActivityEventContext>

export class UserActivityObserver extends BaseObserver<"userActivity", UserActivityEvent> {

  constructor(
    private readonly eventBus: EventBus,
    private readonly userCommand: UserCommand
  ) { super() }

  on<C extends UserActivityEvent["case"]>(
    type: C,
    handler: (e: Extract<UserActivityEvent, { case: C }>) => void
  ): Unsubscribe {
    return this.unsubscribers[type] = this.eventBus.userActivity.on(type, handler)
  }

  register() {
    this.on(
      UserActivityEvent.keys.signIn,
      async (e) => {
        await this.userCommand.addActivityLog(e.userId, e.case)
      }
    )
  }
}