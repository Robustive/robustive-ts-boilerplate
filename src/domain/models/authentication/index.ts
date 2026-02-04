export const IdentityProviderType = {
    Google: "google",
    Github: "github"
} as const

export type IdentityProviderType = typeof IdentityProviderType[keyof typeof IdentityProviderType]

export type BasicClaims = {
    sub: string,
    displayName: string,
    name: {
        givenName: string,
        familyName: string,
        middleName?: string
    },
    email: string,
    photoUrl?: string
}

export type AuthenticationEnvelope = {
    provider: IdentityProviderType
    clientIp: string
    authenticatedAt: Date
    [IdentityProviderType.Google]: BasicClaims
}