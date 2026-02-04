import axios, { AxiosResponse } from "axios"
import { Context, Scenario, Scenes } from "@robustive/robustive-ts"
import { HttpMethod } from "@shared/interfaces"
import { Actor } from "@domain/actors"
import { isAuthenticatedUser } from "@domain/actors/authenticatedUser"

export interface HandOverSettings {
  url: string | null
}

const _settings: HandOverSettings = { url: null }

export function getCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return m ? decodeURIComponent(m[1]) : null
}

export function setHandOverSettings(settings: Partial<HandOverSettings>): void {
  if (settings.url) _settings.url = settings.url
}

export function getHandOverUrl(): string {
  if (_settings.url === null) {
    throw new Error("url is not found")
  }
  return _settings.url
}

export type HandOverToBackend<Z extends Scenes, S extends Scenario<Z>> = (
  actor: Actor,
  context: Context<Z>,
  scenario: S,
  options?: {
    method?: HttpMethod,
    headers?: Record<string, string>
  }
) => Promise<Context<Z>>

export function handOverToBackend<Z extends Scenes, S extends Scenario<Z>>(
  actor: Actor,
  context: Context<Z>,
  scenario: S,
  options: {
    method?: HttpMethod,
    headers?: Record<string, string>
  } = { method: HttpMethod.GET }
): Promise<Context<Z>> {
  const url = getHandOverUrl()
  const { course, scene, ...associatedValues } = context

  return axios
    .request({
      method: options.method,
      headers: {
        ...(isAuthenticatedUser(actor) ? { Authorization: `Bearer ${actor.accessToken}` } : {}),
        ...(options.headers ? options.headers : {})
      },
      url: `${url}/domain/${scenario.domain}/usecase/${scenario.usecase}/course/${course}/scene/${scene}`,
      [options.method === HttpMethod.GET ? "params" : "data"]: {
        id: scenario.id,
        ...associatedValues
      }
    })
    .then(({ data, status }: AxiosResponse) => {
      if (status > 200) {
        throw new Error(`http status: ${status}`)
      }
      const { course, scene, ...associatedValues } = data

      switch (course) {
        case "basics":
          return scenario.just(scenario.basics[scene](associatedValues))
        case "alternatives":
          return scenario.just(scenario.alternatives[scene](associatedValues))
        case "goals":
          return scenario.just(scenario.goals[scene](associatedValues))
        default: {
          throw new Error(`course is unexpected: ${course}`)
        }
      }
    })
}
