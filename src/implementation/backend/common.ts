import { Actor } from "@domain/actors"
import { Usecases } from "@domain/usecases"
import { Context, Courses, Scenes } from "robustive-ts"

export function stepThoughUntil<Z extends Scenes>(
  course: Courses,
  scene: string,
  usecase: Usecases,
  actor: Actor
): Promise<Context<Z>> {
  return usecase.progress(actor).then((context: Context<Z>) => {
    if (context.course === course && context.scene === scene) {
      return context
    }
    if (context.course === "goals") {
      {
        return context
      }
    }
    return stepThoughUntil(course, scene, usecase, actor)
  })
}
