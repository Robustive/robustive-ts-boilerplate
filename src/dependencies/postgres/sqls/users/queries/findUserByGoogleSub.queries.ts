/** Types generated for queries found in "../../src/dependencies/postgres/sqls/users/queries/findUserByGoogleSub.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'FindUserByGoogleSub' parameters type */
export interface IFindUserByGoogleSubParams {
  sub?: string | null | void;
}

/** 'FindUserByGoogleSub' return type */
export interface IFindUserByGoogleSubResult {
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

/** 'FindUserByGoogleSub' query type */
export interface IFindUserByGoogleSubQuery {
  params: IFindUserByGoogleSubParams;
  result: IFindUserByGoogleSubResult;
}

const findUserByGoogleSubIR: any = {"usedParamSet":{"sub":true},"params":[{"name":"sub","required":false,"transform":{"type":"scalar"},"locs":[{"a":359,"b":362}]}],"statement":"SELECT                             \n  u.id,\n  u.role,\n  u.usage_status AS \"usageStatus\",\n  u.display_name AS \"displayName\",\n  u.given_name   AS \"givenName\",\n  u.family_name  AS \"familyName\",\n  u.middle_name  AS \"middleName\",\n  u.email,\n  u.photo_url    AS \"photoUrl\"\nFROM mst_users_google_openid g\n  INNER JOIN mst_users u\n    ON  g.id = u.id\n    AND g.sub = :sub\n    AND g.valid_to = 'infinity'::timestamp\n    AND u.valid_to = 'infinity'::timestamp"};

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
 * FROM mst_users_google_openid g
 *   INNER JOIN mst_users u
 *     ON  g.id = u.id
 *     AND g.sub = :sub
 *     AND g.valid_to = 'infinity'::timestamp
 *     AND u.valid_to = 'infinity'::timestamp
 * ```
 */
export const findUserByGoogleSub = new PreparedQuery<IFindUserByGoogleSubParams,IFindUserByGoogleSubResult>(findUserByGoogleSubIR);


