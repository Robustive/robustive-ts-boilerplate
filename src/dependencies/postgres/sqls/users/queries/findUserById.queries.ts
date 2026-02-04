/** Types generated for queries found in "../../src/dependencies/postgres/sqls/users/queries/findUserById.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'FindUserById' parameters type */
export interface IFindUserByIdParams {
  id?: string | null | void;
}

/** 'FindUserById' return type */
export interface IFindUserByIdResult {
  displayName: string;
  email: string;
  familyName: string | null;
  givenName: string | null;
  id: string;
  middleName: string | null;
  photoUrl: string | null;
  role: string;
  usageStatus: number;
}

/** 'FindUserById' query type */
export interface IFindUserByIdQuery {
  params: IFindUserByIdParams;
  result: IFindUserByIdResult;
}

const findUserByIdIR: any = {"usedParamSet":{"id":true},"params":[{"name":"id","required":false,"transform":{"type":"scalar"},"locs":[{"a":271,"b":273}]}],"statement":"SELECT\n  u.id,\n  u.role,\n  u.usage_status AS \"usageStatus\",\n  u.display_name AS \"displayName\",\n  u.given_name   AS \"givenName\",\n  u.family_name  AS \"familyName\",\n  u.middle_name  AS \"middleName\",\n  u.email,\n  u.photo_url    AS \"photoUrl\"\nFROM mst_users u\nWHERE \n  u.id = :id\n  AND u.valid_to = 'infinity'::timestamp"};

/**
 * Query generated from SQL:
 * ```
 * SELECT
 *   u.id,
 *   u.role,
 *   u.usage_status AS "usageStatus",
 *   u.display_name AS "displayName",
 *   u.given_name   AS "givenName",
 *   u.family_name  AS "familyName",
 *   u.middle_name  AS "middleName",
 *   u.email,
 *   u.photo_url    AS "photoUrl"
 * FROM mst_users u
 * WHERE 
 *   u.id = :id
 *   AND u.valid_to = 'infinity'::timestamp
 * ```
 */
export const findUserById = new PreparedQuery<IFindUserByIdParams,IFindUserByIdResult>(findUserByIdIR);


