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
import { Select } from '../components/ui/Select'
import { useSessionsList } from '../hooks/useLearningQueries'
import * as learningApi from '../lib/api/learning'
import { ApiError } from '../lib/api/types'
import { learningKeys } from '../lib/queryKeys'

function sessionStatusTone(status: string): 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'danger' {
  const normalized = status.toLowerCase()
  if (normalized === 'ready') return 'success'
  if (normalized === 'running' || normalized === 'initializing') return 'warning'
  if (normalized === 'evaluating') return 'primary'
  if (normalized === 'completed') return 'accent'
  if (normalized === 'error') return 'danger'
  return 'default'
}

export function SessionsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data, isLoading, isError, refetch } = useSessionsList()
  const [modalOpen, setModalOpen] = useState(false)
  const [topic, setTopic] = useState('')
  const [courseMode, setCourseMode] = useState<'detailed' | 'micro'>('detailed')
  const [traversalMode, setTraversalMode] = useState<'dfs' | 'bfs'>('dfs')

  const startMutation = useMutation({
    mutationFn: (payload: {
      topic: string
      course_mode: 'detailed' | 'micro'
      traversal_mode: 'dfs' | 'bfs'
    }) => learningApi.startLearning(payload),
    onSuccess: (res) => {
      toast.success('Session started')
      void queryClient.invalidateQueries({ queryKey: learningKeys.sessions() })
      setModalOpen(false)
      setTopic('')
      setCourseMode('detailed')
      setTraversalMode('dfs')
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

  const liveSessionCount =
    data?.sessions.filter((session) => !['completed', 'archived'].includes(session.status.toLowerCase())).length ??
    0

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
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone="primary">Total: {data?.total ?? 0}</Badge>
          <Badge tone="accent">Live: {liveSessionCount}</Badge>
          <Badge tone="success">Ready: {data?.sessions.filter((s) => s.status === 'ready').length ?? 0}</Badge>
        </div>
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
                  <Badge tone={sessionStatusTone(s.status)}>{s.status}</Badge>
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
              onClick={() =>
                topic.trim() &&
                startMutation.mutate({
                  topic: topic.trim(),
                  course_mode: courseMode,
                  traversal_mode: traversalMode,
                })
              }
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
        <div className="mt-4 rounded-2xl border border-border/70 bg-card/30 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">Session setup</p>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <Select
              label="Course mode"
              value={courseMode}
              onChange={(e) => setCourseMode(e.target.value as 'detailed' | 'micro')}
              helperText={
                courseMode === 'detailed'
                  ? 'Long-form explanations and deeper context.'
                  : 'Compact lessons focused on quick iteration.'
              }
              options={[
                { value: 'detailed', label: 'Detailed' },
                { value: 'micro', label: 'Micro' },
              ]}
            />

            <Select
              label="Traversal mode"
              value={traversalMode}
              onChange={(e) => setTraversalMode(e.target.value as 'dfs' | 'bfs')}
              helperText={
                traversalMode === 'dfs'
                  ? 'Go deep into one branch before switching.'
                  : 'Explore breadth across branches earlier.'
              }
              options={[
                { value: 'dfs', label: 'DFS' },
                { value: 'bfs', label: 'BFS' },
              ]}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="primary">Mode: {courseMode}</Badge>
            <Badge tone="accent">Traversal: {traversalMode}</Badge>
          </div>
        </div>
      </Modal>
    </AppShell>
  )
}
