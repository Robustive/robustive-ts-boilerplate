import { isPageId, PageId } from "@domain/models/authentication/authorization"
import { SystemError, SystemErrorCode } from "@shared/systemeError"

/**
 * 文字列を安全にPageId型にキャストする
 * @param value キャストする文字列
 * @returns PageId型の値
 * @throws {SystemError} 無効なPageIdの場合
 */
export function assertPageId(value: string): PageId {
  if (!isPageId(value)) {
    throw new SystemError(SystemErrorCode.invalidPageId({ pageId: value }))
  }
  return value
}