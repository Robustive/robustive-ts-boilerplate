/**
 * ブランド型（Branded Types）- 関数型DDDにおける値オブジェクトの型安全な表現
 *
 * 構造的型付けのTypeScriptで、名目的型付けを実現する。
 * これにより：
 * - UserIdとOrderIdなど、同じstring型でも区別できる
 * - 不正な値の混入を型レベルで防止
 * - コンパイル時に型エラーを検出
 */

import { ServiceError } from "@domain/errors"
import { Result } from "./result"
import { ValidationErrorCode } from "@domain/errors/validation"

// ブランドシンボル（ランタイムには影響しない）
declare const __brand: unique symbol
declare const __type: unique symbol
type Brand<B extends string> = { readonly [__brand]: B }

// ブランド型の定義（T を __type に保持する）
export type Branded<T, B extends string> = T & Brand<B> & { readonly [__type]: T }

export type BrandConstructor<X extends Branded<unknown, string>, E> = {
  key: X[typeof __brand]
  tryFrom: (value: X[typeof __type]) => Result<X, E>
  unsafeFrom: (value: X[typeof __type]) => X
  is: (value: unknown) => value is X
}

export const createBrand = <X extends Branded<unknown, string>, E>(
  brandName: X[typeof __brand],
  validate: (value: X[typeof __type]) => Result<X[typeof __type], E>
): BrandConstructor<X, E> => {

  const key = brandName as X[typeof __brand]

  const tryFrom = (value: X[typeof __type]): Result<X, E> => {
    const validated = validate(value)
    if (validated.isErr()) return Result.Err(validated.error)
    return Result.Ok(validated.value as X)
  }

  const unsafeFrom = (value: X[typeof __type]): X => {
    const result = tryFrom(value)
    if (result.isErr()) {
      throw new ServiceError(ValidationErrorCode.unexpected({ description: `Invalid ${brandName} (${value}): ${JSON.stringify(result.error)}` }))
    }
    return result.value
  }

  const is = (value: unknown): value is X => {
    return validate(value as X[typeof __type]).isOk()
  }

  return { key, tryFrom, unsafeFrom, is }
}
