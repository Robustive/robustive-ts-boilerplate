/**
 * Result型 - 関数型DDDにおけるエラーハンドリングの基盤
 *
 * 例外を投げる代わりに、成功(Ok)または失敗(Err)を戻り値で表現する。
 * これにより：
 * - エラーの可能性が型で明示される
 * - エラーハンドリングが強制される
 * - 関数合成が容易になる
 */

export const ResultType = {
  Ok: "Ok",
  Err: "Err"
} as const

export type ResultType = (typeof ResultType)[keyof typeof ResultType]

abstract class BaseResult<T, E> {
  abstract readonly type: ResultType

  // --- type guards ---
  abstract isOk(): this is Ok<T>
  abstract isErr(): this is Err<E>

  // --- basic ops (instance) ---
  map<U>(f: (value: T) => U): Result<U, E> {
    const self = this as unknown as Result<T, E>
    return self.isOk() ? Result.Ok(f(self.value)) : self
  }

  mapErr<F>(f: (error: E) => F): Result<T, F> {
    const self = this as unknown as Result<T, E>
    return self.isErr() ? Result.Err(f(self.error)) : self
  }

  flatMap<U>(f: (value: T) => Result<U, E>): Result<U, E> {
    const self = this as unknown as Result<T, E>
    return self.isOk() ? f(self.value) : self
  }

  fold<R>(onOk: (value: T) => R, onErr: (error: E) => R): R {
    const self = this as unknown as Result<T, E>
    return self.isOk() ? onOk(self.value) : onErr(self.error)
  }

  getOrElse(defaultValue: T): T {
    return this.isOk() ? this.value : defaultValue
  }

  // --- utilities (static) ---
  static all<T, E>(results: Result<T, E>[]): Result<T[], E> {
    const values: T[] = []
    for (const r of results) {
      if (r.isErr()) return r
      values.push(r.value)
    }
    return Result.Ok(values)
  }

  static allSettled<T, E>(results: Result<T, E>[]): { Ok: T[]; Err: E[] } {
    const okValues: T[] = []
    const errValues: E[] = []
    for (const r of results) {
      if (r.isOk()) okValues.push(r.value)
      else errValues.push(r.error)
    }
    return { Ok: okValues, Err: errValues }
  }

  static tryCatch<T, E>(f: () => T, onError: (e: unknown) => E): Result<T, E> {
    try {
      return Result.Ok(f())
    } catch (e) {
      return Result.Err(onError(e))
    }
  }

  // --- async integration ---
  static async tryCatchAsync<T, E>(
    f: () => Promise<T>,
    onError: (e: unknown) => E
  ): Promise<Result<T, E>> {
    try {
      return Result.Ok(await f())
    } catch (e) {
      return Result.Err(onError(e))
    }
  }

  // Promise<Result<...>> に対する map / flatMap
  static async mapAsyncResult<T, U, E>(
    result: Promise<Result<T, E>>,
    f: (value: T) => U
  ): Promise<Result<U, E>> {
    const r = await result
    return r.map(f)
  }

  static async flatMapAsyncResult<T, U, E>(
    result: Promise<Result<T, E>>,
    f: (value: T) => Promise<Result<U, E>>
  ): Promise<Result<U, E>> {
    const r = await result
    return r.isOk() ? f(r.value) : r
  }
}

export class Ok<T> extends BaseResult<T, never> {
  readonly type = ResultType.Ok
  constructor(public readonly value: T) {
    super()
  }
  isOk(): this is Ok<T> {
    return true
  }
  isErr(): this is Err<never> {
    return false
  }
}

export class Err<E> extends BaseResult<never, E> {
  readonly type = ResultType.Err
  constructor(public readonly error: E) {
    super()
  }
  isOk(): this is Ok<never> {
    return false
  }
  isErr(): this is Err<E> {
    return true
  }
}

export type Result<T, E> = Ok<T> | Err<E>
export const Result = {
  Ok: <T>(v: T): Result<T, never> => new Ok(v),
  Err: <E>(e: E): Result<never, E> => new Err(e),
} as const