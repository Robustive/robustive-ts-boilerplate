/** Types generated for queries found in "../../src/dependencies/postgres/sqls/users/commands/updateUser.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'UpdateUser' parameters type */
export interface IUpdateUserParams {
  displayName: string;
  id: string;
}

/** 'UpdateUser' return type */
export type IUpdateUserResult = void;

/** 'UpdateUser' query type */
export interface IUpdateUserQuery {
  params: IUpdateUserParams;
  result: IUpdateUserResult;
}

const updateUserIR: any = {"usedParamSet":{"displayName":true,"id":true},"params":[{"name":"displayName","required":true,"transform":{"type":"scalar"},"locs":[{"a":38,"b":50}]},{"name":"id","required":true,"transform":{"type":"scalar"},"locs":[{"a":65,"b":68}]}],"statement":"UPDATE mst_users\nSET\n  display_name = :displayName!\nWHERE\n  id = :id!"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE mst_users
 * SET
 *   display_name = :displayName!
 * WHERE
 *   id = :id!
 * ```
 */
export const updateUser = new PreparedQuery<IUpdateUserParams,IUpdateUserResult>(updateUserIR);


