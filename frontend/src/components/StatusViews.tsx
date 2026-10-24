import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { friendlyError, isServiceUnavailable } from '../lib/errors'

export function MenuSkeleton({ cards = 8 }: { cards?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading menu">
      <div className="skeleton h-6 w-40 rounded-md mb-5" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-[14px] p-3 sm:p-4">
            <div className="skeleton w-full aspect-square rounded-[10px] mb-3" />
            <div className="skeleton h-4 w-3/4 rounded mb-2" />
            <div className="skeleton h-4 w-1/3 rounded mb-4" />
            <div className="skeleton h-8 w-full rounded-[8px]" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 max-w-2xl" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-surface border border-border rounded-[12px] p-4">
          <div className="flex justify-between mb-4">
            <div className="skeleton h-4 w-40 rounded" />
            <div className="skeleton h-5 w-20 rounded-full" />
          </div>
          <div className="skeleton h-2 w-full rounded mb-4" />
          <div className="flex gap-2">
            <div className="skeleton h-10 w-32 rounded-[8px]" />
            <div className="skeleton h-10 w-28 rounded-[8px]" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Shown after a few seconds of loading — Render's free tier needs time to wake.
export function SlowLoadingHint({ afterMs = 4000 }: { afterMs?: number }) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setShow(true), afterMs)
    return () => clearTimeout(t)
  }, [afterMs])
  if (!show) return null
  return (
    <motion.p
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-sm text-text-secondary mb-5 flex items-center gap-2"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-60" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
      </span>
      Warming up the kitchen — the first load can take up to a minute.
    </motion.p>
  )
}

interface ErrorStateProps {
  error: unknown
  onRetry?: () => void
  title?: string
}

export function ErrorState({ error, onRetry, title }: ErrorStateProps) {
  const offline = isServiceUnavailable(error)
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto text-center py-16 px-4"
      role="alert"
    >
      <motion.div
        animate={{ rotate: [0, -8, 8, -4, 0] }}
        transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2.5 }}
        className="text-5xl mb-5 inline-block"
        aria-hidden
      >
        {offline ? '🍳' : '😕'}
      </motion.div>
      <h2 className="font-display text-2xl font-semibold text-text mb-2">
        {title ?? (offline ? 'The kitchen is taking a break' : 'Something went wrong')}
      </h2>
      <p className="text-text-secondary mb-6">
        {offline
          ? "We can't reach our servers right now. This usually sorts itself out in a minute."
          : friendlyError(error)}
      </p>
      {onRetry && (
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onRetry}
          className="bg-accent hover:bg-accent-hover text-white px-6 py-2.5 rounded-full text-sm font-medium transition-colors"
        >
          Try again
        </motion.button>
      )}
    </motion.div>
  )
}

interface EmptyStateProps {
  emoji: string
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ emoji, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-sm mx-auto text-center py-16 px-4"
    >
      <motion.div
        initial={{ scale: 0.6, rotate: -12 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 14 }}
        className="text-6xl mb-5"
        aria-hidden
      >
        {emoji}
      </motion.div>
      <h2 className="font-display text-2xl font-semibold text-text mb-2">{title}</h2>
      {description && <p className="text-text-secondary mb-6">{description}</p>}
      {action}
    </motion.div>
  )
}
