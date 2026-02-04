import { VariousPatterns } from "@backend/interfaces"
import { Pool, PoolClient, QueryConfigValues, QueryResult } from "pg"
import { AsyncLocalStorage } from "node:async_hooks"
import { SystemError, SystemErrorCode } from "@shared/systemeError"
import { Result } from "@domain/functional-utils/result"

export const TransactionState = {
  none: "none",
  active: "active",
  committed: "committed",
  rolledback: "rolledback",
  outOfContext: "outOfContext",
} as const

export type TransactionState = typeof TransactionState[keyof typeof TransactionState]

export type TransactionContext = {
  state: TransactionState
  client?: PoolClient
}

type AsyncContext = {
  transaction: TransactionContext
}

export const DbClientType = {
  reader: "reader",
  writer: "writer",
  writerInTransaction: "writerInTransaction",
} as const

export type DbClientType = (typeof DbClientType)[keyof typeof DbClientType]

export interface DataSource<Context, Client> {
  asyncLocalStorage: AsyncLocalStorage<Context>
  defaultState: Context
  begin(): Promise<void>
  commit(): Promise<void>
  rollback(): Promise<void>
  ensureClosed(where: string): Promise<Result<void, SystemError>>
  getReader(): Promise<Client>
  getWriter(): Promise<Client>
}

export class DbClient {
  constructor(
    private _type: DbClientType,
    private _client: PoolClient
  ) { }

  get type(): DbClientType {
    return this._type
  }

  get client(): PoolClient {
    return this._client
  }
}

export type QueryTextAndValues = {
  label: string
  queryText: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  values: QueryConfigValues<any[]>
  expectNumberOfRows: number
}


export class Postgres implements DataSource<AsyncContext, DbClient> {
  static #singleton: Postgres
  #writerPool: Pool
  #readerPool: Pool
  #als: AsyncLocalStorage<AsyncContext>

  private constructor() {
    const pool = new Pool({
      user: process.env.POSTGRES_USER,
      database: process.env.POSTGRES_DATABASE,
      password: process.env.POSTGRES_PASSWORD,
      port: process.env.POSTGRES_PORT ? Number(process.env.POSTGRES_PORT) : undefined,
      host: process.env.POSTGRES_HOST,
      ssl: false,
      connectionTimeoutMillis: 5_000,
      max: 10,
      idleTimeoutMillis: 30_000,
    })
    this.#writerPool = pool
    this.#readerPool = pool
    this.#als = new AsyncLocalStorage<AsyncContext>()
  }

  static get shared(): Postgres {
    return this.#singleton ??= new Postgres()
  }

  get asyncLocalStorage(): AsyncLocalStorage<AsyncContext> {
    return this.#als
  }

  get defaultState(): AsyncContext {
    return { transaction: { state: TransactionState.none } }
  }

  // getClient(): Promise<PoolClient> {
  //   return this.#pool.connect()
  // }

  private getCurrentContext(): AsyncContext {
    return this.#als.getStore() ?? { transaction: { state: TransactionState.outOfContext } }
  }

  private recursiveConnect(retry = 5): Promise<void> {
    const dbInfo = `(host: ${process.env.POSTGRES_HOST}, port: ${process.env.POSTGRES_PORT ? Number(process.env.POSTGRES_PORT) : 5432
      }, user: ${process.env.POSTGRES_USER}, db: ${process.env.POSTGRES_DATABASE})`
    return this.#writerPool
      .connect()
      .then((client) => {
        return client
          .query("SELECT NOW() AS now")
          .then((result) => {
            const now = new Date(result.rows[0].now)
            if (isNaN(now.getTime())) {
              throw new Error(`postgres接続エラー ${dbInfo}`)
            }
            return console.info(`Postgres connected ${dbInfo}.`)
          })
          .finally(() => client.release())
      })
      .catch((err) => {
        if (retry > 0) {
          console.info(
            `postgresへの接続に失敗しました。10秒後にリトライします（残り${retry}回）...`,
            err
          )
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve(this.recursiveConnect(--retry))
            }, 10 * 1000)
          })
        } else {
          console.error("postgresへの接続に失敗しました。", err)
          return err
        }
      })
  }

  isReady(): Promise<void> {
    return this.recursiveConnect()
  }

  errorFormatter<E extends Error>(
    err: E,
    sqlfile: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    values: QueryConfigValues<any[]>
  ): E {
    if (values) {
      console.info(
        sqlfile,
        values.map((val, idx) => {
          if (Array.isArray(val)) {
            return `$${idx + 1}::[${val.slice(0, 3).join(",")},...]`
          } else {
            return `$${idx + 1}::${val}`
          }
        })
      )
    } else {
      console.info(sqlfile)
    }

    // このエラーはバインド変数が配列で、その子要素が配列でその要素数が合わない場合に起こる。
    // 配列と普通の値を配列としてバインド変数に渡しても起きる。
    if (err.message.indexOf("malformed array literal:") === 0) {
      err.message = `malformed array literal: ${values
        .map((val, idx) => {
          if (Array.isArray(val)) {
            const tmp = val
              .map((v, _idx) => (Array.isArray(v) ? `[idx](len=${v.length})` : null))
              .filter((v) => v !== null)
              .join(", ")
            return `$${idx + 1}::[${tmp}]`
          } else {
            // malformed array literalの場合は必ず配列のはず。
            return `$${idx + 1}::${val}`
          }
        })
        .join(", ")}`
    }

    return err
  }

  /**
   *
   * @param queryText
   * @param values
   * @param _e 呼び出し元のStacTraceを使いたいため、引数で作成している
   * @returns
   */
  executeSql<R = VariousPatterns>(
    queryText: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    values?: QueryConfigValues<any[]>,
    _e = new Error()
  ): Promise<QueryResult<R>> {
    return this.#writerPool
      .connect()
      .then((client) => {
        return client.query(queryText, values).finally(() => client.release())
      })
      .then((result) => {
        if (values) {
          console.info(
            queryText,
            values.map((val, idx) => {
              if (Array.isArray(val)) {
                return `$${idx + 1}::[${val.slice(0, 3).join(",")},...]`
              } else {
                return `$${idx + 1}::${val}`
              }
            })
          )
        } else {
          console.info(queryText)
        }
        return result
      })
      .catch((err) => {
        const e = this.errorFormatter(err, queryText, values)
        _e.message = e.message
        throw _e
      })
  }

  /**
   *
   * @param queryTextAndValuesArr
   * @param _e 呼び出し元のStacTraceを使いたいため、引数で作成している
   * @returns
   */
  executeSqlWithTransaction(queryTextAndValuesArr: QueryTextAndValues[], _e = new Error()) {
    return this.#writerPool
      .connect()
      .then((client) => {
        let next: QueryTextAndValues | null = null
        let executing = ""
        const ret: QueryResult<VariousPatterns>[] = []

        const recursiveExecuteSql = (
          arr: QueryTextAndValues[],
          promise = client.query("BEGIN")
        ): Promise<QueryResult<VariousPatterns>[]> => {
          if (arr.length < 1) {
            return promise.then((result) => {
              ret.push(result)
              if (process.env.IS_ALWAYS_ROLLBACK === "true") {
                console.info("TRANSACTION [ROLLBACK: IS_ALWAYS_ROLLBACK = true]")
                return client.query("ROLLBACK").then(() => {
                  return Promise.resolve(ret)
                })
              }
              console.info("TRANSACTION [COMMIT]")
              return client.query("COMMIT").then(() => {
                return Promise.resolve(ret)
              })
            })
          }

          return promise.then(() => {
            next = arr.shift()
            executing = next.label
            const expectNumberOfRows = next.expectNumberOfRows
            return client
              .query({
                text: next.queryText,
                values: next.values
              })
              .then((result) => {
                if (expectNumberOfRows && expectNumberOfRows !== result.rowCount) {
                  _e.message = `件数が一致しません（期待する値: ${expectNumberOfRows}、実際の結果: ${result.rowCount}`
                  throw _e
                }
                console.info(`TRANSACTION [${executing}] success!`)
                if (next.values) {
                  console.info(
                    next.queryText,
                    next.values.map((val, idx) => {
                      if (Array.isArray(val)) {
                        return `$${idx + 1}::[${val.slice(0, 3).join(",")},...]`
                      } else {
                        return `$${idx + 1}::${val}`
                      }
                    })
                  )
                } else {
                  console.info(next.queryText)
                }
                ret.push(result)
                return recursiveExecuteSql(arr, promise)
              })
          })
        }

        console.info("TRANSACTION [BEGIN]")
        return recursiveExecuteSql(queryTextAndValuesArr, client.query("BEGIN"))
          .catch((err) => {
            err.message += `\nROLLBACK at ${executing}`
            console.info(`TRANSACTION [ROLLBACK: ${executing}]`)
            client.query("ROLLBACK")
            const e = this.errorFormatter(err, next.queryText, next.values)
            throw e
          })
          .finally(() => client.release())
      })
      .catch((err) => {
        _e.message = err.message
        // _systemError.code = err.code
        throw _e
      })
  }

  private enabledClients = new WeakSet<PoolClient>();

  private formatParam(value: unknown) {
    if (value === null) return "null"
    if (value === undefined) return "undefined"
    if (value === '') return "''"
    if (typeof value === "string") {
      // 長すぎる文字列は省略
      return value.length > 100
        ? `'${value.slice(0, 100)}…(${value.length})'`
        : `'${value}'`
    }
    if (value instanceof Date) {
      return value.toISOString()
    }
    if (Array.isArray(value)) {
      return value.map(this.formatParam)
    }
    if (typeof value === "object") {
      return JSON.stringify(value)
    }
    return value
  }

  private enableQueryLogging(client: PoolClient): PoolClient {
    if (this.enabledClients.has(client)) return client

    const originalQuery = client.query.bind(client)
    client.query = async (...args: any[]) => {
      const [query, params] = args
      if (typeof query === "string") {
        console.info("[sql]", query)
        if (params) {
          const formattedParams = Array.isArray(params)
            ? `{ ${params.map((p, idx) => `$${idx + 1}: ${this.formatParam(p)}`).join(", ")} }`
            : params

          if (formattedParams) {
            console.info("[params]", formattedParams)
          } else {
            console.info("[params]", params)
          }
        }
      } else {
        console.info("[sql]", query.text)
        console.info("[params]", `{ ${query.values.map((val, idx) => `$${idx + 1}: ${val}`).join(", ")} }`)
      }
      return originalQuery(...args)
    }
    this.enabledClients.add(client)
    return client
  }

  async begin(): Promise<void> {
    const { transaction } = this.getCurrentContext()
    if (transaction.state === TransactionState.outOfContext) {
      throw new SystemError(SystemErrorCode.outOfAsyncContext({
        debuggingLead: "Postgres.shared.asyncLocalStorage.run({ state: TransactionState.none() }, fn) されていない箇所で呼ばれている"
      }))
    }
    if (transaction.state === TransactionState.active) return
    return this.#writerPool.connect()
      .then((client) => {
        return this.enableQueryLogging(client)
      })
      .then((client) => {
        return client.query("BEGIN").then(() => {
          transaction.state = TransactionState.active
          transaction.client = client
          console.info("[TX] begun")
        })
      })
  }

  async commit(): Promise<void> {
    const { transaction } = this.getCurrentContext()
    if (transaction.state === TransactionState.outOfContext) {
      throw new SystemError(SystemErrorCode.outOfAsyncContext({
        debuggingLead: "Postgres.shared.asyncLocalStorage.run({ state: TransactionState.none() }, fn) されていない箇所で呼ばれている"
      }))
    }
    if (transaction.state !== TransactionState.active || !transaction.client) {
      console.info(`[TX] state is ${transaction.state}, skip commit.`)
      return Promise.resolve()
    }

    await transaction.client
      .query("COMMIT")
      .then(() => {
        console.info("[TX] commit successful")
      })
      .catch((e) => {
        console.error("[TX] commit error", e)
        throw e
      })
      .finally(() => {
        transaction.client?.release()
      })

    transaction.state = TransactionState.committed
    delete transaction.client
  }

  async rollback(): Promise<void> {
    const { transaction } = this.getCurrentContext()
    if (transaction.state === TransactionState.outOfContext) {
      throw new SystemError(SystemErrorCode.outOfAsyncContext({
        debuggingLead: "Postgres.shared.asyncLocalStorage.run({ state: TransactionState.none() }, fn) されていない箇所で呼ばれている"
      }))
    }
    if (transaction.state !== TransactionState.active || !transaction.client) {
      console.info(`[TX] state is ${transaction.state}, skip rollback.`)
      return Promise.resolve()
    }

    await transaction.client.query("ROLLBACK")
      .then(() => {
        console.info("[TX] rollback successful")
      })
      .catch((e) => {
        console.error("[TX] rollback error", e)
        throw e
      })
      .finally(() => {
        transaction.client?.release()
      })
    transaction.state = TransactionState.rolledback
    delete transaction.client
  }

  /**
   * ★これが “COMMIT忘れ回収” のコア
   * たとえば goals 到達時・リクエスト終了時に呼ぶ
   */
  async ensureClosed(where: string): Promise<Result<void, SystemError>> {
    const { transaction } = this.getCurrentContext()
    if (transaction.state === TransactionState.outOfContext) {
      return Result.Err(new SystemError(SystemErrorCode.outOfAsyncContext({
        debuggingLead: "Postgres.shared.asyncLocalStorage.run({ state: TransactionState.none() }, fn) されていない箇所で呼ばれている"
      })))
    }
    if (transaction.state === TransactionState.active) {
      // commit忘れは危険なので rollback が安全
      console.warn(`[TX] auto-rollback at ${where}.`)
      return this.rollback().then(() => {
        return Result.Err(new SystemError(SystemErrorCode.unknownError({ debuggingLead: `${where} で transaction を auto-rollback しました` })))
      })
    }
    return Result.Ok(undefined)
  }

  /**
   * 
   * @returns Reader用のコネクションを返します。WriterDBでのアクティブなトランザクションがある場合にはそのコネクションを返します。
   */
  getReader(): Promise<DbClient> {
    const { transaction } = this.getCurrentContext()
    if (transaction.state === TransactionState.outOfContext) {
      console.warn("getReader() is being called outside of the AsyncLocalStorage context.")
    }
    if (transaction.state === TransactionState.active) {
      return Promise.resolve(new DbClient(DbClientType.writerInTransaction, transaction.client))
    }

    return this.#readerPool.connect()
      .then((client) => {
        return this.enableQueryLogging(client)
      })
      .then((client) => {
        return new DbClient(DbClientType.reader, client)
      })
  }

  /**
   * 
   * @returns アクティブなトランザクションがある場合にはそのコネクションを、ない場合には新しいWriter用のコネクションを返します。
   */
  getWriter(): Promise<DbClient> {
    const { transaction } = this.getCurrentContext()
    if (transaction.state === TransactionState.outOfContext) {
      throw new SystemError(SystemErrorCode.outOfAsyncContext({
        debuggingLead: "Postgres.shared.asyncLocalStorage.run({ state: TransactionState.none() }, fn) されていない箇所で呼ばれている"
      }))
    }
    if (transaction.state === TransactionState.active) {
      return Promise.resolve(new DbClient(DbClientType.writerInTransaction, transaction.client))
    }

    return this.#writerPool.connect()
      .then((client) => {
        return this.enableQueryLogging(client)
      })
      .then((client) => {
        return new DbClient(DbClientType.writer, client)
      })
  }
}
