import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MAX_QUANTITY_PER_ITEM } from '../lib/pricing'

interface CounterProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  size?: 'sm' | 'lg'
}

export default function Counter({ value, onChange, min = 1, max = MAX_QUANTITY_PER_ITEM, size = 'sm' }: CounterProps) {
  const [editing, setEditing] = useState(false)
  const [tempValue, setTempValue] = useState(String(value))
  const [direction, setDirection] = useState(1)

  function change(next: number) {
    const clamped = Math.min(max, Math.max(min, next))
    setDirection(clamped >= value ? 1 : -1)
    onChange(clamped)
  }

  function commitEdit() {
    const parsed = parseInt(tempValue, 10)
    if (!isNaN(parsed)) change(parsed)
    setEditing(false)
  }

  const btn = size === 'lg' ? 'w-9 h-9 text-lg' : 'w-7 h-7'
  const mid = size === 'lg' ? 'w-10 h-9 text-base' : 'w-8 h-7 text-sm'

  return (
    <div
      className="inline-flex items-center border border-border rounded-full overflow-hidden bg-surface"
      onClick={(e) => e.stopPropagation()}
    >
      <motion.button
        type="button"
        whileTap={{ scale: 0.8 }}
        onClick={() => change(value - 1)}
        disabled={value <= min}
        aria-label="Decrease quantity"
        className={`${btn} flex items-center justify-center text-text hover:bg-border disabled:opacity-35 disabled:hover:bg-transparent transition-colors`}
      >
        −
      </motion.button>
      {editing ? (
        <input
          autoFocus
          inputMode="numeric"
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value.replace(/[^0-9]/g, ''))}
          onBlur={commitEdit}
          onKeyDown={(e) => { if (e.key === 'Enter') commitEdit() }}
          aria-label="Quantity"
          className={`${mid} text-center bg-transparent text-text outline-none`}
        />
      ) : (
        <span
          role="button"
          tabIndex={0}
          aria-label={`Quantity ${value}, click to edit`}
          onClick={() => { setEditing(true); setTempValue(String(value)) }}
          onKeyDown={(e) => { if (e.key === 'Enter') { setEditing(true); setTempValue(String(value)) } }}
          className={`${mid} flex items-center justify-center text-text font-medium overflow-hidden relative cursor-text tabular-nums`}
        >
          <AnimatePresence mode="popLayout" initial={false} custom={direction}>
            <motion.span
              key={value}
              custom={direction}
              variants={{
                enter: (d: number) => ({ y: d * 12, opacity: 0 }),
                center: { y: 0, opacity: 1 },
                exit: (d: number) => ({ y: d * -12, opacity: 0 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.16 }}
              className="block"
            >
              {value}
            </motion.span>
          </AnimatePresence>
        </span>
      )}
      <motion.button
        type="button"
        whileTap={{ scale: 0.8 }}
        onClick={() => change(value + 1)}
        disabled={value >= max}
        aria-label="Increase quantity"
        className={`${btn} flex items-center justify-center text-text hover:bg-border disabled:opacity-35 disabled:hover:bg-transparent transition-colors`}
      >
        +
      </motion.button>
    </div>
  )
}
