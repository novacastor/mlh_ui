import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { ProgressBar } from '../components/ui/ProgressBar'
import { Skeleton } from '../components/ui/Skeleton'
import { Badge } from '../components/ui/Badge'
import { useSessionsList } from '../hooks/useLearningQueries'
import * as learningApi from '../lib/api/learning'
import { ApiError } from '../lib/api/types'
import { learningKeys } from '../lib/queryKeys'

export function SessionsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data, isLoading, isError, refetch } = useSessionsList()
  const [modalOpen, setModalOpen] = useState(false)
  const [topic, setTopic] = useState('')

  const startMutation = useMutation({
    mutationFn: (t: string) => learningApi.startLearning({ topic: t }),
    onSuccess: (res) => {
      toast.success('Session started')
      void queryClient.invalidateQueries({ queryKey: learningKeys.sessions() })
      setModalOpen(false)
      setTopic('')
      navigate(`/sessions/${res.session_id}`)
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) {
        toast.error(err.message)
      } else {
        toast.error('Could not start session')
      }
    },
  })

  const archiveMutation = useMutation({
    mutationFn: (id: string) => learningApi.archiveSession(id),
    onSuccess: () => {
      toast.success('Session archived')
      void queryClient.invalidateQueries({ queryKey: learningKeys.sessions() })
    },
    onError: () => toast.error('Could not archive session'),
  })

  return (
    <AppShell
      actions={
        <Button variant="primary" className="!px-4 !py-2 text-xs" onClick={() => setModalOpen(true)}>
          New topic
        </Button>
      }
    >
      <div className="mb-10">
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-semibold tracking-tight md:text-4xl"
        >
          Your sessions
        </motion.h1>
        <p className="mt-2 max-w-xl text-muted">
          Resume where you left off or begin a new adaptive path. The backend keeps state; you stay in flow.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : null}

      {isError ? (
        <Card className="border-danger/30 bg-danger/5">
          <p className="text-sm">Could not load sessions.</p>
          <Button variant="secondary" className="mt-4" onClick={() => void refetch()}>
            Retry
          </Button>
        </Card>
      ) : null}

      {data && data.sessions.length === 0 ? (
        <Card className="text-center">
          <p className="text-muted">No sessions yet.</p>
          <Button variant="primary" className="mt-6" onClick={() => setModalOpen(true)}>
            Start learning
          </Button>
        </Card>
      ) : null}

      {data && data.sessions.length > 0 ? (
        <motion.ul
          className="grid gap-4 md:grid-cols-2"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.06 } },
          }}
        >
          {data.sessions.map((s) => (
            <motion.li
              key={s.session_id}
              variants={{
                hidden: { opacity: 0, y: 10 },
                show: { opacity: 1, y: 0 },
              }}
            >
              <Card className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      to={`/sessions/${s.session_id}`}
                      className="font-semibold text-foreground hover:text-primary"
                    >
                      {s.topic}
                    </Link>
                    <p className="mt-1 text-xs text-muted">
                      {new Date(s.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge tone="default">{s.status}</Badge>
                </div>
                <div className="mt-4">
                  <ProgressBar value={s.overall_progress} aria-label={`Progress for ${s.topic}`} />
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    className="!text-xs text-danger"
                    onClick={() => archiveMutation.mutate(s.session_id)}
                    disabled={archiveMutation.isPending}
                  >
                    Archive
                  </Button>
                  <Link to={`/sessions/${s.session_id}`}>
                    <Button variant="secondary" className="!px-4 !py-2 text-xs">
                      Open
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.li>
          ))}
        </motion.ul>
      ) : null}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New learning session"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => topic.trim() && startMutation.mutate(topic.trim())}
              isLoading={startMutation.isPending}
              disabled={!topic.trim()}
            >
              Start
            </Button>
          </>
        }
      >
        <Input
          label="Topic"
          placeholder="e.g. Machine Learning fundamentals"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
      </Modal>
    </AppShell>
  )
}
