/** Types generated for queries found in "../../src/dependencies/postgres/sqls/users/commands/createUserFromGoogleOpenId.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'CreateUserFromGoogleOpenId' parameters type */
export interface ICreateUserFromGoogleOpenIdParams {
  displayName?: string | null | void;
  email?: string | null | void;
  familyName?: string | null | void;
  givenName?: string | null | void;
  id?: string | null | void;
  middleName?: string | null | void;
  photoUrl?: string | null | void;
  role?: string | null | void;
  sub?: string | null | void;
}

/** 'CreateUserFromGoogleOpenId' return type */
export type ICreateUserFromGoogleOpenIdResult = void;

/** 'CreateUserFromGoogleOpenId' query type */
export interface ICreateUserFromGoogleOpenIdQuery {
  params: ICreateUserFromGoogleOpenIdParams;
  result: ICreateUserFromGoogleOpenIdResult;
}

const createUserFromGoogleOpenIdIR: any = {"usedParamSet":{"id":true,"role":true,"displayName":true,"givenName":true,"familyName":true,"middleName":true,"email":true,"photoUrl":true,"sub":true},"params":[{"name":"id","required":false,"transform":{"type":"scalar"},"locs":[{"a":137,"b":139},{"a":282,"b":284}]},{"name":"role","required":false,"transform":{"type":"scalar"},"locs":[{"a":142,"b":146}]},{"name":"displayName","required":false,"transform":{"type":"scalar"},"locs":[{"a":149,"b":160}]},{"name":"givenName","required":false,"transform":{"type":"scalar"},"locs":[{"a":163,"b":172}]},{"name":"familyName","required":false,"transform":{"type":"scalar"},"locs":[{"a":175,"b":185}]},{"name":"middleName","required":false,"transform":{"type":"scalar"},"locs":[{"a":188,"b":198}]},{"name":"email","required":false,"transform":{"type":"scalar"},"locs":[{"a":201,"b":206}]},{"name":"photoUrl","required":false,"transform":{"type":"scalar"},"locs":[{"a":209,"b":217}]},{"name":"sub","required":false,"transform":{"type":"scalar"},"locs":[{"a":276,"b":279}]}],"statement":"WITH insert_user AS (\n  INSERT INTO mst_users (id, role, display_name, given_name, family_name, middle_name, email, photo_url)\n  VALUES (:id, :role, :displayName, :givenName, :familyName, :middleName, :email, :photoUrl)\n)\nINSERT INTO mst_users_google_openid (sub, id)\nVALUES (:sub, :id)"};

/**
 * Query generated from SQL:
 * ```
 * WITH insert_user AS (
 *   INSERT INTO mst_users (id, role, display_name, given_name, family_name, middle_name, email, photo_url)
 *   VALUES (:id, :role, :displayName, :givenName, :familyName, :middleName, :email, :photoUrl)
 * )
 * INSERT INTO mst_users_google_openid (sub, id)
 * VALUES (:sub, :id)
 * ```
 */
export const createUserFromGoogleOpenId = new PreparedQuery<ICreateUserFromGoogleOpenIdParams,ICreateUserFromGoogleOpenIdResult>(createUserFromGoogleOpenIdIR);


