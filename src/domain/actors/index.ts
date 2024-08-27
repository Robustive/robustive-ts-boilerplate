import { Nobody } from "./nobody"
import { AuthenticatedUser } from "./authenticatedUser"
import { Service } from "./service"

export type Actor = Nobody | AuthenticatedUser | Service
