/** Types generated for queries found in "../../src/dependencies/postgres/sqls/users/queries/findUserByEmail.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'FindUserByEmail' parameters type */
export interface IFindUserByEmailParams {
  email?: string | null | void;
}

/** 'FindUserByEmail' return type */
export interface IFindUserByEmailResult {
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

/** 'FindUserByEmail' query type */
export interface IFindUserByEmailQuery {
  params: IFindUserByEmailParams;
  result: IFindUserByEmailResult;
}

const findUserByEmailIR: any = {"usedParamSet":{"email":true},"params":[{"name":"email","required":false,"transform":{"type":"scalar"},"locs":[{"a":303,"b":308}]}],"statement":"SELECT                             \n  u.id,\n  u.role,\n  u.usage_status AS \"usageStatus\",\n  u.display_name AS \"displayName\",\n  u.given_name   AS \"givenName\",\n  u.family_name  AS \"familyName\",\n  u.middle_name  AS \"middleName\",\n  u.email,\n  u.photo_url    AS \"photoUrl\"\nFROM mst_users u\nWHERE \n  u.email = :email\n  AND u.valid_to = 'infinity'::timestamp"};

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
 *   u.email = :email
 *   AND u.valid_to = 'infinity'::timestamp
 * ```
 */
export const findUserByEmail = new PreparedQuery<IFindUserByEmailParams,IFindUserByEmailResult>(findUserByEmailIR);


