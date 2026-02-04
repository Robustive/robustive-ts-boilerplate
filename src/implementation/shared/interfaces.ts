// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type VariousPatterns = any

export interface Entity<T> {
  properties: T
}

export interface ValueObject<T> {
  properties: T
}

/**
 * staticメソッド定義のためのクラス型
 */
export interface WithStatic<T> {
  new(...args: VariousPatterns): T
}

export const HttpMethod = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  PATCH: "PATCH",
  DELETE: "DELETE",
  /* Purposeful items */
  POST_TO_REJECT_REQUESTS_WITHOUT_USER_INTERACTION_AS_PART_OF_CSRF_PROTECTION: "POST"
} as const

export type HttpMethod = (typeof HttpMethod)[keyof typeof HttpMethod]
