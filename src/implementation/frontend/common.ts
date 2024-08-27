import axios, { AxiosResponse } from "axios"
import { Context, Scenario, Scenes } from "robustive-ts"

export interface HandOverSettings {
  url: string | null
}

const _settings: HandOverSettings = { url: null }

export function setHandOverSettings(settings: Partial<HandOverSettings>): void {
  if (settings.url) _settings.url = settings.url
}

export function getHandOverUrl(): string {
  if (_settings.url === null) {
    throw new Error("url is not found")
  }
  return _settings.url
}

export function handOverToBackend<Z extends Scenes, S extends Scenario<Z>>(
  context: Context<Z>,
  scenario: S
): Promise<Context<Z>> {
  const url = getHandOverUrl()
  const { course, scene, ...associatedValues } = context

  return axios
    .get(
      `${url}/domain/${scenario.domain}/usecase/${scenario.usecase}/course/${course}/scene/${scene}`,
      {
        params: {
          id: scenario.id,
          ...associatedValues
        }
      }
    )
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
