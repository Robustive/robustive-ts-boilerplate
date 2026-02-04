import { Context, Scenario, Scenes } from "@robustive/robustive-ts"
import { HttpMethod } from "@shared/interfaces"
import { Actor } from "@domain/actors"

export function mockHandOverToBackend<Z extends Scenes, S extends Scenario<Z>>(
  fn: (scenario: S, actor: Actor, context: Context<Z>) => Promise<Context<Z>>
): (
  actor: Actor,
  context: Context<Z>,
  scenario: S,
  options?: {
    method?: HttpMethod,
    headers?: Record<string, string>
  }
) => Promise<Context<Z>> {
  return async (
    actor: Actor,
    context: Context<Z>,
    scenario: S,
    options: {
      method?: HttpMethod,
      headers?: Record<string, string>
    } = { method: HttpMethod.GET }
  ): Promise<Context<Z>> => {
    return fn(
      scenario,
      actor,
      context,
    )
  }
}