import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '../ui/Button'
import type { EvaluationResponse, QuizResponse } from '../../lib/api/types'

type QuizComponentProps = {
  quiz: QuizResponse
  evaluation?: EvaluationResponse
  isSubmitting: boolean
  isContinuing: boolean
  onSubmit: (answers: number[]) => void
  onContinue: () => void
}

export function QuizComponent({
  quiz,
  evaluation,
  isSubmitting,
  isContinuing,
  onSubmit,
  onContinue,
}: QuizComponentProps) {
  const [answers, setAnswers] = useState<Array<number | null>>(() => quiz.questions.map(() => null))
  const [submittedLocally, setSubmittedLocally] = useState(false)

  const resultById = useMemo(() => {
    const map = new Map<string, EvaluationResponse['question_results'][number]>()
    for (const result of evaluation?.question_results ?? []) {
      map.set(result.question_id, result)
    }
    return map
  }, [evaluation])

  const hasFeedback = resultById.size > 0
  const allAnswered = answers.every((value) => value !== null)

  const choose = (questionIndex: number, optionIndex: number) => {
    if (hasFeedback) return
    setAnswers((prev) => {
      const next = [...prev]
      next[questionIndex] = optionIndex
      return next
    })
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-white/[0.02] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">Quiz Checkpoint</p>
        <span className="text-xs text-muted">{quiz.questions.length} questions</span>
      </div>

      <div className="mt-4 space-y-4">
        {quiz.questions.map((question, questionIndex) => {
          const result = resultById.get(question.question_id)

          return (
            <div key={question.question_id} className="rounded-xl border border-border/60 bg-card/40 p-3">
              <p className="text-sm font-medium leading-relaxed">
                {questionIndex + 1}. {question.question}
              </p>
              <div className="mt-3 grid gap-2">
                {question.options.map((option, optionIndex) => {
                  const localSelected = answers[questionIndex] === optionIndex
                  const isCorrect = result?.correct_index === optionIndex
                  const isWrongPick = result?.user_index === optionIndex && !result?.is_correct

                  const tone = hasFeedback
                    ? isCorrect
                      ? 'border-success/55 bg-success/10 text-foreground'
                      : isWrongPick
                        ? 'border-danger/55 bg-danger/10 text-foreground'
                        : 'border-border/60 bg-white/[0.02] text-muted'
                    : localSelected
                      ? 'border-primary/55 bg-primary/14 text-foreground'
                      : 'border-border/60 bg-white/[0.02] text-muted hover:border-primary/40 hover:text-foreground'

                  return (
                    <button
                      key={`${question.question_id}-${optionIndex}`}
                      type="button"
                      onClick={() => choose(questionIndex, optionIndex)}
                      className={`rounded-lg border px-3 py-2 text-left text-sm transition ${tone}`}
                    >
                      <span className="mr-2 text-xs font-semibold text-muted">{String.fromCharCode(65 + optionIndex)}</span>
                      {option}
                    </button>
                  )
                })}
              </div>
              {hasFeedback && result ? (
                <p className="mt-2 text-xs text-muted">
                  {result.is_correct
                    ? 'Correct.'
                    : `Your answer: ${question.options[result.user_index] ?? '—'} • Correct: ${question.options[result.correct_index]}`}
                </p>
              ) : null}
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex justify-end">
        <AnimatePresence mode="wait">
          {hasFeedback ? (
            <motion.div
              key="continue"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              <Button isLoading={isContinuing} onClick={onContinue}>
                Continue
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="submit"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              <Button
                disabled={!allAnswered || isSubmitting}
                isLoading={isSubmitting}
                onClick={() => {
                  if (!allAnswered) return
                  setSubmittedLocally(true)
                  onSubmit(answers.map((answer) => answer ?? 0))
                }}
              >
                Submit Quiz
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {submittedLocally && !hasFeedback && !isSubmitting ? (
        <p className="mt-2 text-right text-xs text-muted">Waiting for evaluator results…</p>
      ) : null}
    </div>
  )
}
