import { Account } from "@domain/models/authentication/user"
import { BaseCommand } from "../baseCommand"
import { createUserGoogleOpenId } from "@dependencies/postgres/sqls/users/commands/createUserGoogleOpenId.queries"
import { createUserFromGoogleOpenId } from "@dependencies/postgres/sqls/users/commands/createUserFromGoogleOpenId.queries"
import { GoogleSub, UserId } from "@domain/models/authentication/type"

export interface UserCommand {
  createUserFromGoogleOpenId(sub: GoogleSub, account: Account): Promise<void>
  createUserGoogleOpenId(sub: GoogleSub, id: UserId): Promise<void>

  addActivityLog(id: UserId, type: string): Promise<void>
}

export class PgUserCommand extends BaseCommand implements UserCommand {

  createUserFromGoogleOpenId(sub: GoogleSub, account: Account): Promise<void> {
    return this.runCommandOnContext(
      (client) => createUserFromGoogleOpenId.run({
        sub,
        id: account.id,
        role: account.role.case,
        displayName: account.displayName,
        familyName: account.name.familyName,
        givenName: account.name.givenName,
        middleName: account.name.middleName,
        email: account.email,
        photoUrl: account.photoUrl,
      }, client)
    )
      .then((_result) => {
        return
      })
  }

  createUserGoogleOpenId(sub: GoogleSub, id: UserId): Promise<void> {
    return this.runCommandOnContext(
      (client) => createUserGoogleOpenId.run({
        sub,
        id
      }, client)
    )
      .then((_result) => {
        return
      })
  }

  addActivityLog(id: UserId, type: string): Promise<void> {
    console.info("[OBSERVER] addActivityLog", { id, type })
    return Promise.resolve()
  }
}