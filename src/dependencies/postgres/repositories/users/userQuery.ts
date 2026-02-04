import { Account, AccountDto } from "@domain/models/authentication/user"
import { findUserById } from "../../sqls/users/queries/findUserById.queries"
import { BaseQuery } from "../baseQuery"
import { findUserByGoogleSub } from "@dependencies/postgres/sqls/users/queries/findUserByGoogleSub.queries"
import { findUserByEmail } from "@dependencies/postgres/sqls/users/queries/findUserByEmail.queries"
import { Email, GoogleSub, UserId } from "@domain/models/authentication/type"

export interface UserQuery {
  findById(id: UserId): Promise<Account | null>
  findByEmail(email: Email): Promise<Account | null>
  findByGoogleSub(sub: GoogleSub): Promise<Account | null>
}

export type UserRow = Awaited<ReturnType<typeof findUserById.run>>[number]

export function mapUserRowToAccount(row: UserRow): Account {

  const accountDto: AccountDto = {
    id: row.id,
    role: row.role,
    usageStatus: row.usageStatus,
    displayName: row.displayName,
    name: {
      givenName: row.givenName,
      familyName: row.familyName,
      middleName: row.middleName
    },
    email: row.email,
    photoUrl: row.photoUrl
  }

  return Account.unsafeFrom(accountDto)
}

export class PgUserQuery extends BaseQuery implements UserQuery {

  async findById(id: UserId): Promise<Account | null> {
    const queryOne = this.createQueryOne(findUserById)
    return queryOne<UserRow>({ id })
      .then((result) => {
        return result ? mapUserRowToAccount(result) : null
      })
  }

  async findByEmail(email: Email): Promise<Account | null> {
    const queryOne = this.createQueryOne(findUserByEmail)
    return queryOne<UserRow>({ email })
      .then((result) => {
        return result ? mapUserRowToAccount(result) : null
      })
  }

  async findByGoogleSub(sub: GoogleSub): Promise<Account | null> {
    const queryOne = this.createQueryOne(findUserByGoogleSub)
    return queryOne<UserRow>({ sub })
      .then((result) => {
        return result ? mapUserRowToAccount(result) : null
      })
  }
}
