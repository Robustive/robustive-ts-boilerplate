import { Result } from "./result"

// 一般的なバリデーション関数
export const nonEmpty = <E>(error: E) => (value: string): Result<string, E> =>
  value.trim().length > 0 ? Result.Ok(value) : Result.Err(error as E)

export const minLength = <E>(min: number, error: E) => (value: string): Result<string, E> =>
  value.length >= min ? Result.Ok(value) : Result.Err(error as E)

export const maxLength = <E>(max: number, error: E) => (value: string): Result<string, E> =>
  value.length <= max ? Result.Ok(value) : Result.Err(error as E)

export const pattern = <E>(regex: RegExp, error: E) => (value: string): Result<string, E> =>
  regex.test(value) ? Result.Ok(value) : Result.Err(error as E)

export const inRange = <E>(min: number, max: number, error: E) => (value: number): Result<number, E> =>
  value >= min && value <= max ? Result.Ok(value) : Result.Err(error as E)

// バリデーションの合成
export const composeValidations = <T, E, V extends Array<(value: T) => Result<T, E>>>(
  ...validators: V
) => (value: T): Result<T, E> => {
  for (const validator of validators) {
    const result = validator(value)
    if (result.isErr()) return result
  }
  return Result.Ok(value)
}
