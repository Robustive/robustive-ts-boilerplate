import { DataSource, TransactionContext, TransactionState } from "@dependencies/postgres"
import { Result } from "@domain/functional-utils/result"
import { SwiftEnum, SwiftEnumCases } from "@robustive/robustive-ts"
import { SystemError, SystemErrorCode } from "@shared/systemeError"
import { AsyncLocalStorage } from "async_hooks"

const TransactionEvent = {
  begin: "begin",
  commit: "commit",
  rollback: "rollback",
} as const

type TransactionEvent = typeof TransactionEvent[keyof typeof TransactionEvent]

type SqlEventContext = {
  transaction: { query: TransactionEvent }
  query: { name: string, args: Object }
  command: { name: string, args: Object }
}

export const SqlEvent = new SwiftEnum<SqlEventContext>()
export type SqlEvent = SwiftEnumCases<SqlEventContext>


type MockContext = {
  transaction: TransactionContext
}

export class MockClient {
  constructor(private _type: string) { }
  get type(): string {
    return this._type
  }
}

export class MockDataSource implements DataSource<MockContext, MockClient> {
  private als: AsyncLocalStorage<MockContext>
  private _sqlLog: SqlEvent[] = []

  constructor() {
    this.als = new AsyncLocalStorage<MockContext>()
  }
  get asyncLocalStorage(): AsyncLocalStorage<MockContext> {
    return this.als
  }

  get defaultState(): MockContext {
    return { transaction: { state: TransactionState.none } }
  }

  private getCurrentContext(): MockContext {
    return this.als.getStore() ?? { transaction: { state: TransactionState.outOfContext } }
  }

  async begin(): Promise<void> {
    const { transaction } = this.getCurrentContext()
    if (transaction.state === TransactionState.outOfContext) {
      throw new SystemError(SystemErrorCode.outOfAsyncContext({
        debuggingLead: "Postgres.shared.asyncLocalStorage.run({ state: TransactionState.none() }, fn) されていない箇所で呼ばれている"
      }))
    }
    if (transaction.state === TransactionState.active) return

    this._sqlLog.push(SqlEvent.transaction({ query: TransactionEvent.begin }))
    transaction.state = TransactionState.active
  }

  async commit(): Promise<void> {
    const { transaction } = this.getCurrentContext()
    if (transaction.state === TransactionState.outOfContext) {
      throw new SystemError(SystemErrorCode.outOfAsyncContext({
        debuggingLead: "Postgres.shared.asyncLocalStorage.run({ state: TransactionState.none() }, fn) されていない箇所で呼ばれている"
      }))
    }
    if (transaction.state !== TransactionState.active) return

    this._sqlLog.push(SqlEvent.transaction({ query: TransactionEvent.commit }))
    transaction.state = TransactionState.committed
  }

  async rollback(): Promise<void> {
    const { transaction } = this.getCurrentContext()
    if (transaction.state === TransactionState.outOfContext) {
      throw new SystemError(SystemErrorCode.outOfAsyncContext({
        debuggingLead: "Postgres.shared.asyncLocalStorage.run({ state: TransactionState.none() }, fn) されていない箇所で呼ばれている"
      }))
    }
    if (transaction.state !== TransactionState.active) return

    this._sqlLog.push(SqlEvent.transaction({ query: TransactionEvent.rollback }))
    transaction.state = TransactionState.rolledback
  }

  async ensureClosed(where: string): Promise<Result<void, SystemError>> {
    const { transaction } = this.getCurrentContext()
    if (transaction.state === TransactionState.outOfContext) {
      return Result.Err(new SystemError(SystemErrorCode.outOfAsyncContext({
        debuggingLead: "Postgres.shared.asyncLocalStorage.run({ state: TransactionState.none() }, fn) されていない箇所で呼ばれている"
      })))
    }
    if (transaction.state === TransactionState.active) {
      return this.rollback().then(() => {
        return Result.Err(new SystemError(SystemErrorCode.unknownError({ debuggingLead: `${where} で transaction を auto-rollback しました` })))
      })
    }
    return Result.Ok(undefined)
  }

  async getReader(): Promise<MockClient> {
    return new MockClient("reader")
  }

  async getWriter(): Promise<MockClient> {
    return new MockClient("writer")
  }
}