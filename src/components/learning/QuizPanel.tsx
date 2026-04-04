import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import type { QuizResponse } from '../../lib/api/types'

type QuizPanelProps = {
  quiz: QuizResponse
  onSubmit: (answers: number[]) => void
  isSubmitting: boolean
}

export function QuizPanel({ quiz, onSubmit, isSubmitting }: QuizPanelProps) {
  const [answers, setAnswers] = useState<number[]>(() => quiz.questions.map(() => 0))

  const setOption = (qi: number, optIndex: number) => {
    setAnswers((prev) => {
      const next = [...prev]
      next[qi] = optIndex
      return next
    })
  }

  const valid =
    answers.length === quiz.questions.length &&
    answers.every((a, i) => a >= 0 && a < quiz.questions[i].options.length)

  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-widest text-muted">Quiz</p>
      <p className="mt-1 text-sm text-muted">{quiz.node_id}</p>
      <div className="mt-8 space-y-8">
        {quiz.questions.map((q, qi) => (
          <div key={q.question_id}>
            <p className="text-sm font-medium leading-relaxed">
              {qi + 1}. {q.question}
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <AnimatePresence mode="popLayout">
                {q.options.map((opt, oi) => {
                  const selected = answers[qi] === oi
                  return (
                    <motion.button
                      key={oi}
                      type="button"
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: oi * 0.03 }}
                      onClick={() => setOption(qi, oi)}
                      className={`
                        rounded-xl border px-4 py-3 text-left text-sm transition
                        ${
                          selected
                            ? 'border-primary bg-primary/15 text-foreground shadow-[var(--shadow-glow)]'
                            : 'border-border bg-white/[0.03] text-muted hover:border-primary/35 hover:text-foreground'
                        }
                      `}
                    >
                      <span className="mr-2 font-mono text-xs text-muted">{String.fromCharCode(65 + oi)}</span>
                      {opt}
                    </motion.button>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-10 flex justify-end border-t border-border pt-6">
        <Button
          disabled={!valid || isSubmitting}
          isLoading={isSubmitting}
          onClick={() => onSubmit(answers)}
        >
          Submit answers
        </Button>
      </div>
    </Card>
  )
}
