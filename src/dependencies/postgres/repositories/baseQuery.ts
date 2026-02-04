import { SystemError, SystemErrorCode } from "@shared/systemeError";
import { DbClientType, Postgres } from "..";
import { PoolClient } from "pg";

type PgTypedQuery = {
  run: (params: any, client: PoolClient) => Promise<any[]>;
}

export class BaseQuery {

  protected runQueryOnContext<T>(
    fn: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    return Postgres.shared.getReader()
      .then((dbClient) => {
        if (dbClient.type === DbClientType.writerInTransaction) {
          return fn(dbClient.client)
            .catch((error) => {
              console.info(`[TX] an error occurred in transaction... will rollback (error: ${error.message}).`)
              return Postgres.shared.rollback()
                .then(() => {
                  throw error
                })
            })
        } else {
          return fn(dbClient.client)
            .finally(() => dbClient.client.release())
        }
      })
  }

  protected createQueryOne<Q extends PgTypedQuery>(query: Q) {
    return async <Result = Awaited<ReturnType<Q["run"]>>[number]>(
      params: Parameters<Q["run"]>[0]
    ): Promise<Result | null> => {
      const rows = await this.runQueryOnContext((client) => query.run(params, client))
      if (rows.length === 0) return null
      if (rows.length > 1) {
        throw new SystemError(SystemErrorCode.unknownError({ debuggingLead: "結果が一つに絞れていないので SQL を見直してください" }));
      }
      return rows[0] as Result
    }
  }

  protected createQueryMany<Q extends PgTypedQuery>(query: Q) {
    return async <Result = Awaited<ReturnType<Q["run"]>>[number]>(
      params: Parameters<Q["run"]>[0]
    ): Promise<Result[]> => {
      return this.runQueryOnContext((client) => query.run(params, client))
    }
  }
}