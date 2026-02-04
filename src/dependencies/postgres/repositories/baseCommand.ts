import { DbClientType, Postgres } from "..";
import { PoolClient } from "pg";

export class BaseCommand {

  protected runCommandOnContext<T>(
    fn: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    return Postgres.shared.getWriter()
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
}