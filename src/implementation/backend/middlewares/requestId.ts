// request-id.ts
import type { RequestHandler } from "express"
import { randomUUID } from "crypto"

declare global {
  namespace Express {
    interface Request {
      requestId: string
    }
  }
}

type Options = {
  headerName?: string // default: x-request-id
  generator?: () => string
}

export function requestId(options: Options = {}): RequestHandler {
  const headerName = (options.headerName ?? "x-request-id").toLowerCase()
  const gen = options.generator ?? randomUUID

  return (req, res, next) => {
    const fromHeader = req.header(headerName)
    const id = fromHeader && fromHeader.trim() ? fromHeader : gen()

    req.requestId = id
    res.setHeader(headerName, id)

    next()
  }
}