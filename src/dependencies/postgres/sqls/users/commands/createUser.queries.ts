/** Types generated for queries found in "../../src/dependencies/postgres/sqls/users/createUser.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'CreateUser' parameters type */
export interface ICreateUserParams {
  display_name?: string | null | void;
  email?: string | null | void;
  family_name?: string | null | void;
  given_name?: string | null | void;
  id?: string | null | void;
  middle_name?: string | null | void;
  photo_url?: string | null | void;
}

/** 'CreateUser' return type */
export type ICreateUserResult = void;

/** 'CreateUser' query type */
export interface ICreateUserQuery {
  params: ICreateUserParams;
  result: ICreateUserResult;
}

const createUserIR: any = { "usedParamSet": { "id": true, "display_name": true, "given_name": true, "family_name": true, "middle_name": true, "email": true, "photo_url": true }, "params": [{ "name": "id", "required": false, "transform": { "type": "scalar" }, "locs": [{ "a": 124, "b": 126 }] }, { "name": "display_name", "required": false, "transform": { "type": "scalar" }, "locs": [{ "a": 131, "b": 143 }] }, { "name": "given_name", "required": false, "transform": { "type": "scalar" }, "locs": [{ "a": 148, "b": 158 }] }, { "name": "family_name", "required": false, "transform": { "type": "scalar" }, "locs": [{ "a": 163, "b": 174 }] }, { "name": "middle_name", "required": false, "transform": { "type": "scalar" }, "locs": [{ "a": 179, "b": 190 }] }, { "name": "email", "required": false, "transform": { "type": "scalar" }, "locs": [{ "a": 195, "b": 200 }] }, { "name": "photo_url", "required": false, "transform": { "type": "scalar" }, "locs": [{ "a": 205, "b": 214 }] }], "statement": "INSERT INTO mst_users (\n  id,\n  display_name,\n  given_name,\n  family_name,\n  middle_name,\n  email,\n  photo_url\n) VALUES (\n  :id,\n  :display_name,\n  :given_name,\n  :family_name,\n  :middle_name,\n  :email,\n  :photo_url\n)" };

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO mst_users (
 *   id,
 *   display_name,
 *   given_name,
 *   family_name,
 *   middle_name,
 *   email,
 *   photo_url
 * ) VALUES (
 *   :id,
 *   :display_name,
 *   :given_name,
 *   :family_name,
 *   :middle_name,
 *   :email,
 *   :photo_url
 * )
 * ```
 */
export const createUser = new PreparedQuery<ICreateUserParams, ICreateUserResult>(createUserIR);


