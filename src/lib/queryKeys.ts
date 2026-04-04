export const learningKeys = {
  all: ['learning'] as const,
  sessions: () => [...learningKeys.all, 'sessions'] as const,
  session: (id: string) => [...learningKeys.all, 'session', id] as const,
  status: (id: string) => [...learningKeys.session(id), 'status'] as const,
  lesson: (id: string) => [...learningKeys.session(id), 'lesson'] as const,
  quiz: (id: string) => [...learningKeys.session(id), 'quiz'] as const,
  evaluation: (id: string) => [...learningKeys.session(id), 'evaluation'] as const,
  nextAction: (id: string) => [...learningKeys.session(id), 'nextAction'] as const,
  choices: (id: string) => [...learningKeys.session(id), 'choices'] as const,
  workflow: (id: string) => [...learningKeys.session(id), 'workflow'] as const,
  progress: (id: string) => [...learningKeys.session(id), 'progress'] as const,
}

export const authKeys = {
  profile: ['auth', 'profile'] as const,
}
