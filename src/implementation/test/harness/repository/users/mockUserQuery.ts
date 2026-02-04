import { UserQuery } from "@dependencies/postgres/repositories/users/userQuery"
import { Email, GoogleSub, UserId } from "@domain/models/authentication/type";
import { Account, AccountDto } from "@domain/models/authentication/user";
import { SqlEvent } from "../../mockDataSource";

const accountDtoStub: AccountDto = {
  id: "019c084d-52e1-76b9-8abe-9762e0e3e99a",
  role: "personal",
  usageStatus: 0,
  displayName: "斉藤 祐輔",
  name: {
    givenName: "祐輔",
    familyName: "斉藤",
  },
  email: "yusuke.saito@jibunstyle.com",
  photoUrl: "https://lh3.googleusercontent.com/a/ACg8ocIq2MUkJkFoXh4tL8zLH7wnWe6G9ENTz3DYBybii45YWka7Q2Wm=s96-c"
}

export class MockUserQuery implements UserQuery {

  private _sqlLog: SqlEvent[] = []

  async findById(id: UserId): Promise<Account | null> {
    this._sqlLog.push(SqlEvent.query({name: "findById", args: [id] }))
    return Account.unsafeFrom(accountDtoStub)
  }

  async findByEmail(email: Email): Promise<Account | null> {
    this._sqlLog.push(SqlEvent.query({name: "findByEmail", args: [email] }))
    return Account.unsafeFrom(accountDtoStub)
  }

  async findByGoogleSub(sub: GoogleSub): Promise<Account | null> {
    this._sqlLog.push(SqlEvent.query({name: "findByGoogleSub", args: [sub] }))
    return Account.unsafeFrom(accountDtoStub)
  }
}
