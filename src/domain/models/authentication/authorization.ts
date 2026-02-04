import { AccountRole, CollaborationRole, Role, TeamRole } from "@domain/actors"
import { ServiceError } from "@domain/errors"
import { AuthenticationErrorCode } from "@domain/errors/authentication"

export const PageId = {
  Main: "Main",
  Home: "Home",
  Profile: "Profile",
  ProfileEdit: "ProfileEdit"
} as const

export type PageId = typeof PageId[keyof typeof PageId]

/**
 * 文字列が有効なPageIdかどうかを判定する型ガード
 * @param value チェックする文字列
 * @returns 有効なPageIdの場合はtrue
 */
export function isPageId(value: string): value is PageId {
  return Object.values(PageId).includes(value as PageId)
}

type PageAccessControlMap = {
  [R in Role["case"]]: readonly PageId[]
}

const EVERYONE_CAN_ACCESS: readonly PageId[] = [PageId.Main, PageId.Home] as const
const AUTHENTICATED_CAN_ACCESS: readonly PageId[] = [...EVERYONE_CAN_ACCESS, PageId.Profile, PageId.ProfileEdit] as const

/**
 * ページアクセス制御の定義
 * 各ページに対して、アクセス可能なロールを定義する
 */
const PAGE_ACCESS_CONTROL: PageAccessControlMap = {
  [AccountRole.keys.anonymous]: EVERYONE_CAN_ACCESS,
  [AccountRole.keys.personal]: AUTHENTICATED_CAN_ACCESS,
  [TeamRole.keys.owner]: AUTHENTICATED_CAN_ACCESS,
  [TeamRole.keys.admin]: AUTHENTICATED_CAN_ACCESS,
  [TeamRole.keys.member]: AUTHENTICATED_CAN_ACCESS,
  [TeamRole.keys.viewer]: AUTHENTICATED_CAN_ACCESS,
  [CollaborationRole.keys.collaborator]: AUTHENTICATED_CAN_ACCESS,
  [CollaborationRole.keys.guest]: AUTHENTICATED_CAN_ACCESS,
} as const

export class RoleAuthorizationRules {
  /**
   * 指定されたロールが指定されたページにアクセス可能かを判定する
   * @param role ユーザーのロール
   * @param pageId ページID
   * @returns アクセス可能な場合は true
   */
  static canRoleAccessPage(role: Role, pageId: PageId): boolean {
    const allowedPages = PAGE_ACCESS_CONTROL[role.case]

    // Roleが定義されていない場合はエラー
    if (!allowedPages) {
      throw new ServiceError(AuthenticationErrorCode.pageAccessControlNotDefined({ role: role.case }))
    }

    return allowedPages.includes(pageId)
  }
}
