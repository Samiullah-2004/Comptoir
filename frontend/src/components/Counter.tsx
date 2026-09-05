import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface CounterProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
}

export default function Counter({ value, onChange, min = 1, max = 20 }: CounterProps) {
  const [editing, setEditing] = useState(false)
  const [tempValue, setTempValue] = useState(String(value))

  function decrement() {
    onChange(Math.max(min, value - 1))
  }
  function increment() {
    onChange(Math.min(max, value + 1))
  }
  function commitEdit() {
    const parsed = parseInt(tempValue, 10)
    if (!isNaN(parsed)) {
      onChange(Math.min(max, Math.max(min, parsed)))
    } else {
      setTempValue(String(value))
    }
    setEditing(false)
  }

  return (
    <div className="flex items-center border border-border rounded-[6px] overflow-hidden">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); decrement() }}
        className="w-7 h-7 flex items-center justify-center text-text hover:bg-border transition-colors"
      >
        −
      </button>
      {editing ? (
        <input
          autoFocus
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value.replace(/[^0-9]/g, ''))}
          onBlur={commitEdit}
          onKeyDown={(e) => { if (e.key === 'Enter') commitEdit() }}
          onClick={(e) => e.stopPropagation()}
          className="w-8 text-center bg-transparent text-text text-sm outline-none"
        />
      ) : (
        <span
          onClick={(e) => { e.stopPropagation(); setEditing(true); setTempValue(String(value)) }}
          className="w-8 h-7 flex items-center justify-center text-sm text-text overflow-hidden relative cursor-text"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={value}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="block"
            >
              {value}
            </motion.span>
          </AnimatePresence>
        </span>
      )}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); increment() }}
        className="w-7 h-7 flex items-center justify-center text-text hover:bg-border transition-colors"
      >
        +
      </button>
    </div>
  )
}