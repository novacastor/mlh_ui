import { motion } from 'framer-motion'
import { Card } from '../ui/Card'
import type { LessonResponse } from '../../lib/api/types'

type LessonViewProps = {
  lesson: LessonResponse
}

export function LessonView({ lesson }: LessonViewProps) {
  const { tutor_content: t, curator_content: c } = lesson
  const tutor = t ?? {
    learning_objective: 'Learning objective not available yet.',
    explanation: 'Explanation is not available yet for this node.',
    examples: [] as string[],
    common_misconception: 'No misconception note available yet.',
    practice_task: 'No practice task available yet.',
    code_snippet: '',
  }
  const curator = c ?? {
    articles: [],
    videos: [],
    courses: [],
    references: [],
  }

  return (
    <div className="space-y-6">
      {lesson.is_remediation ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm font-medium text-accent"
        >
          Remediation focus
        </motion.p>
      ) : null}

      <Card>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Objective</p>
        <p className="mt-2 text-lg font-medium leading-snug">{tutor.learning_objective}</p>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted">
          <p>{tutor.explanation}</p>
          {tutor.examples?.length ? (
            <ul className="list-inside list-disc space-y-1">
              {tutor.examples.map((ex, i) => (
                <li key={`${i}-${ex.slice(0, 40)}`}>{ex}</li>
              ))}
            </ul>
          ) : null}
          <div className="rounded-xl border border-border/80 bg-white/[0.04] p-4">
            <p className="text-xs font-medium text-foreground">Common misconception</p>
            <p className="mt-1">{tutor.common_misconception}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-foreground">Practice</p>
            <p className="mt-1">{tutor.practice_task}</p>
          </div>
          {tutor.code_snippet?.trim() ? (
            <pre className="overflow-x-auto rounded-xl border border-border bg-black/40 p-4 text-xs text-foreground/90">
              <code>{tutor.code_snippet}</code>
            </pre>
          ) : null}
        </div>
      </Card>

      <Card>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Curated resources</p>
        <div className="mt-4 space-y-3">
          {curator.articles.map((a) => (
            <a
              key={a.url}
              href={a.url}
              target="_blank"
              rel="noreferrer"
              className="block rounded-xl border border-border/60 bg-white/[0.03] px-4 py-3 text-sm transition hover:border-primary/40 hover:bg-white/[0.06]"
            >
              <span className="font-medium text-foreground">{a.title}</span>
              <span className="mt-1 block truncate text-xs text-muted">{a.url}</span>
              {a.description ? (
                <p className="mt-2 text-xs leading-relaxed text-muted">{a.description}</p>
              ) : null}
            </a>
          ))}
          {curator.videos?.length ? (
            <div className="pt-2">
              <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted">Videos</p>
              <ul className="space-y-3">
                {curator.videos.map((v, i) => (
                  <li key={v.url ?? i}>
                    <a
                      href={v.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-xl border border-border/60 bg-white/[0.03] px-4 py-3 transition hover:border-primary/40 hover:bg-white/[0.06]"
                    >
                      {v.title ? (
                        <span className="text-sm font-medium text-foreground">{v.title}</span>
                      ) : null}
                      <span className="mt-1 block truncate text-xs text-muted">{v.url}</span>
                      {v.description ? (
                        <p className="mt-2 text-xs leading-relaxed text-muted">{v.description}</p>
                      ) : null}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {curator.courses?.length ? (
            <div className="pt-2">
              <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted">Courses</p>
              <ul className="space-y-3">
                {curator.courses.map((course, i) => (
                  <li key={course.url ?? `course-${i}`}>
                    {course.url ? (
                      <a
                        href={course.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-xl border border-border/60 bg-white/[0.03] px-4 py-3 transition hover:border-primary/40 hover:bg-white/[0.06]"
                      >
                        {course.title ? (
                          <span className="text-sm font-medium text-foreground">{course.title}</span>
                        ) : null}
                        <span className="mt-1 block truncate text-xs text-muted">{course.url}</span>
                        {course.description ? (
                          <p className="mt-2 text-xs leading-relaxed text-muted">{course.description}</p>
                        ) : null}
                      </a>
                    ) : (
                      <div className="rounded-xl border border-border/60 bg-white/[0.03] px-4 py-3 text-sm text-muted">
                        {course.title ?? 'Course'}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {curator.references?.map((r) => (
            <p key={r} className="text-sm text-muted">
              {r}
            </p>
          ))}
        </div>
      </Card>
    </div>
  )
}
