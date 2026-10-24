import { AnimatePresence, motion } from 'framer-motion'

interface ToastProps {
  message: string
  show: boolean
  action?: { label: string; onClick: () => void }
}

export default function Toast({ message, show, action }: ToastProps) {
  return (
    <div className="fixed bottom-6 inset-x-0 flex justify-center z-50 pointer-events-none px-4" aria-live="polite">
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="pointer-events-auto bg-text text-bg pl-4 pr-2 py-2 rounded-full shadow-2xl text-sm font-medium flex items-center gap-3 max-w-full"
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.08, type: 'spring', stiffness: 500, damping: 15 }}
              className="w-5 h-5 rounded-full bg-success text-white flex items-center justify-center text-[11px] flex-shrink-0"
              aria-hidden
            >
              ✓
            </motion.span>
            <span className="truncate">{message}</span>
            {action ? (
              <button
                onClick={action.onClick}
                className="bg-accent hover:bg-accent-hover text-white text-xs px-3 py-1.5 rounded-full flex-shrink-0 transition-colors"
              >
                {action.label}
              </button>
            ) : (
              <span className="w-1" />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
