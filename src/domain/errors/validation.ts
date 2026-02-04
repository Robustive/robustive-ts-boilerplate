import { SwiftEnum, SwiftEnumCases } from "@robustive/robustive-ts"

type ValidationErrorContext = {
    EmptyValue: { field: string }
    InvalidFormat: { field: string; message: string }
    InvalidUuid: { value: string }
    TooLong: { field: string; maxLength: number }
    UnknownValue: { field: string; value: string }

    // unsafeFrom で OK な場面でエラーなった場合のエラー
    unexpected: { description: string }
}

export const ValidationErrorCode = new SwiftEnum<ValidationErrorContext>()
export type ValidationErrorCode = SwiftEnumCases<ValidationErrorContext>
