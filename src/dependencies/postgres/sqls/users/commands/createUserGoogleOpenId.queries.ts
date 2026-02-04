/** Types generated for queries found in "../../src/dependencies/postgres/sqls/users/commands/createUserGoogleOpenId.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'CreateUserGoogleOpenId' parameters type */
export interface ICreateUserGoogleOpenIdParams {
  id?: string | null | void;
  sub?: string | null | void;
}

/** 'CreateUserGoogleOpenId' return type */
export type ICreateUserGoogleOpenIdResult = void;

/** 'CreateUserGoogleOpenId' query type */
export interface ICreateUserGoogleOpenIdQuery {
  params: ICreateUserGoogleOpenIdParams;
  result: ICreateUserGoogleOpenIdResult;
}

const createUserGoogleOpenIdIR: any = {"usedParamSet":{"sub":true,"id":true},"params":[{"name":"sub","required":false,"transform":{"type":"scalar"},"locs":[{"a":63,"b":66}]},{"name":"id","required":false,"transform":{"type":"scalar"},"locs":[{"a":71,"b":73}]}],"statement":"INSERT INTO mst_users_google_openid (\n  sub,\n  id\n) VALUES (\n  :sub,\n  :id\n)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO mst_users_google_openid (
 *   sub,
 *   id
 * ) VALUES (
 *   :sub,
 *   :id
 * )
 * ```
 */
export const createUserGoogleOpenId = new PreparedQuery<ICreateUserGoogleOpenIdParams,ICreateUserGoogleOpenIdResult>(createUserGoogleOpenIdIR);


