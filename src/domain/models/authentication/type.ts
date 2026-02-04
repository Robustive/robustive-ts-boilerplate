import { ValidationErrorCode } from "@domain/errors/validation";
import { Branded, createBrand } from "@domain/functional-utils/brand";
import { Result } from "@domain/functional-utils/result";
import { composeValidations, maxLength, nonEmpty, pattern } from "@domain/functional-utils/validator";
import { v7 as uuidv7 } from "uuid"

const REGEX = {
  uuidV7: /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^https?:\/\/.+/
} as const

export type UserId = Branded<string, "UserId">
export const UserId = {
  generate: (): UserId => UserId.unsafeFrom(uuidv7()),
  ...createBrand<UserId, ValidationErrorCode>(
    "UserId",
    composeValidations(
      nonEmpty(ValidationErrorCode.EmptyValue({ field: "UserId" })),
      pattern(REGEX.uuidV7, ValidationErrorCode.InvalidUuid({ value: "" }))
    )
  )
}

export type Email = Branded<string, "Email">
export const Email = createBrand<Email, ValidationErrorCode>(
  "Email",
  composeValidations(
    nonEmpty(ValidationErrorCode.EmptyValue({ field: "Email" })),
    pattern(REGEX.email, ValidationErrorCode.InvalidFormat({ field: "Email", message: "Invalid email format" }))
  )
)


const MAX_DISPLAY_NAME_LENGTH = 100
export type DisplayName = Branded<string, "DisplayName">
export const DisplayName = createBrand<DisplayName, ValidationErrorCode>(
  "DisplayName",
  composeValidations(
    nonEmpty(ValidationErrorCode.EmptyValue({ field: "DisplayName" })),
    maxLength(MAX_DISPLAY_NAME_LENGTH, ValidationErrorCode.TooLong({ field: "DisplayName", maxLength: MAX_DISPLAY_NAME_LENGTH }))
  )
)

const MAX_NAME_LENGTH = 50
export type GivenName = Branded<string, "GivenName">
export const GivenName = createBrand<GivenName, ValidationErrorCode>(
  "GivenName",
  composeValidations(
    nonEmpty(ValidationErrorCode.EmptyValue({ field: "GivenName" })),
    maxLength(MAX_NAME_LENGTH, ValidationErrorCode.TooLong({ field: "GivenName", maxLength: MAX_NAME_LENGTH }))
  )
)

export type FamilyName = Branded<string, "FamilyName">
export const FamilyName = createBrand<FamilyName, ValidationErrorCode>(
  "FamilyName",
  composeValidations(
    nonEmpty(ValidationErrorCode.EmptyValue({ field: "FamilyName" })),
    maxLength(MAX_NAME_LENGTH, ValidationErrorCode.TooLong({ field: "FamilyName", maxLength: MAX_NAME_LENGTH }))
  )
)

export type GoogleSub = Branded<string, "GoogleSub">
export const GoogleSub = createBrand<GoogleSub, ValidationErrorCode>(
  "GoogleSub",
  nonEmpty(ValidationErrorCode.EmptyValue({ field: "GoogleSub" }))
)

export type PhotoUrl = Branded<string, "PhotoUrl">
const validatePhotoUrl = (value: string): Result<string, ValidationErrorCode> => {
  if (value === "") return Result.Ok(value) // 空文字は許可（オプショナル）
  return REGEX.url.test(value) ? Result.Ok(value) : Result.Err(ValidationErrorCode.InvalidFormat({ field: "PhotoUrl", message: "Invalid URL format" }))
}

export const PhotoUrl = createBrand<PhotoUrl, ValidationErrorCode>(
  "PhotoUrl",
  validatePhotoUrl
)