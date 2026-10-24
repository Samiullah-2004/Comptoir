import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import Counter from './Counter'
import { formatPKR } from '../lib/pricing'
import { optimizedImage } from '../lib/image'
import type { MenuItem } from '../types'

interface Props {
  item: MenuItem
  categoryName?: string
  onClose: () => void
  onAdd: (item: MenuItem, quantity: number) => void
}

export default function ProductModal({ item, categoryName, onClose, onAdd }: Props) {
  const [quantity, setQuantity] = useState(1)

  // Lock page scroll and support Escape while the modal is open.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const image = optimizedImage(item.imageUrl, 900)

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        layoutId={`card-${item.id}`}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="relative bg-surface rounded-t-[22px] sm:rounded-[20px] overflow-hidden w-full sm:max-w-md max-h-[92dvh] overflow-y-auto no-scrollbar shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`modal-title-${item.id}`}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/45 hover:bg-black/65 backdrop-blur-md text-white flex items-center justify-center transition-colors"
        >
          ✕
        </button>

        <motion.div layoutId={`image-${item.id}`} className="w-full aspect-[4/3] bg-white overflow-hidden">
          {image ? (
            <img src={image} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-border flex items-center justify-center text-5xl">🍽️</div>
          )}
        </motion.div>

        <div className="p-5 sm:p-6">
          {categoryName && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-[11px] uppercase tracking-[0.16em] text-text-secondary mb-1.5"
            >
              {categoryName}
            </motion.p>
          )}
          <motion.h2
            layoutId={`title-${item.id}`}
            id={`modal-title-${item.id}`}
            className="font-display text-2xl sm:text-[28px] leading-tight text-text mb-2"
          >
            {item.name}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-text-secondary mb-5 text-sm sm:text-base"
          >
            Freshly prepared with quality ingredients, made to order.
          </motion.p>
          <div className="flex items-center justify-between mb-5">
            <motion.span layoutId={`price-${item.id}`} className="text-accent-fg text-2xl font-semibold">
              {formatPKR(item.price)}
            </motion.span>
            <Counter value={quantity} onChange={setQuantity} size="lg" />
          </div>
          <motion.button
            whileHover={item.available ? { scale: 1.02 } : undefined}
            whileTap={item.available ? { scale: 0.98 } : undefined}
            disabled={!item.available}
            onClick={() => {
              onAdd(item, quantity)
              onClose()
            }}
            className="w-full bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:hover:bg-accent text-white px-5 py-3 rounded-full font-medium flex items-center justify-center gap-2 transition-colors"
          >
            {item.available ? (
              <>
                Add to cart
                <span className="opacity-60">·</span>
                {formatPKR(item.price * quantity)}
              </>
            ) : (
              'Currently unavailable'
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}
