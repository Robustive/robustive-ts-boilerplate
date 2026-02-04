import type { ErrorRequestHandler } from "express"

export class DomainNotAuthorizedError extends Error {
  private _domain: string
  constructor(domain: string) {
    super(`${domain} is not allowed.`)
    this._domain = domain
  }

  get domain(): string {
    return this._domain
  }
}

type AppError = Error & { status?: number; code?: string };


export function errorHandler(): ErrorRequestHandler {
  return (err: AppError, req, res, _next) => {
    const status = err.status ?? 500

    if (err instanceof DomainNotAuthorizedError) {
      if (req.session && req.session.authError) {
        res.cookie("session_error", JSON.stringify(req.session.authError.code), { httpOnly: true, path: "/" })
      }
      return res.redirect("/")
    }

    // ここでログ（requestIdなど）を混ぜるのが実務的
    // console.error(`[${req.requestId ?? "no-rid"}]`, err);
    console.error(err)

    // Unhandled
    res.status(status).json({
      error: {
        message: status === 500 ? "Internal Server Error" : err.message,
        code: err.code,
        // requestId: req.requestId,
      }
    })
  }
}