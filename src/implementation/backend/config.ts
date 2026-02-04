import { config as shared } from "@shared/config"

export const config = {
  BACKEND_GLOBAL_PREFIX: shared.BACKEND_GLOBAL_PREFIX,
  AUTHORIZED_DOMAIN: "jibunstyle.com",
  SSO: {
    google: {
      isEnable: true,
      authPath: "/auth/google",
      callbackPath: "/auth/google/callback"
    },
    // github: {
    //   isEnable: false,
    // }
  },
  SESSION_MANAGER: process.env.SESSION_MANAGER || "jwt",
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "default_jwt_access_secret",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "default_jwt_refresh_secret",
  ACCESS_TOKEN_EXPIRES_IN: "10m",
  REFRESH_TOKEN_EXPIRES_IN: "30d"
} as const
