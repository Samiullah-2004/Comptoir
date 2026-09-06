import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Lanyard from './lanyard/Lanyard'

const DISPLAY_MS = 3000
const FADE_SECONDS = 0.6

export default function Preloader() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), DISPLAY_MS)
    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05, filter: 'blur(8px)' }}
          transition={{ duration: FADE_SECONDS, ease: [0.65, 0, 0.35, 1] }}
          className="fixed inset-0 z-[100] bg-bg flex items-center justify-center overflow-hidden"
        >
          <div className="absolute inset-0">
            <Lanyard
              position={[0, 0, 18]}
              gravity={[0, -40, 0]}
              transparent
              frontImage="/logo-mark.png"
              imageFit="contain"
            />
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 40, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.5 }}
            className="relative z-10 font-display text-7xl sm:text-8xl font-semibold text-text tracking-wide"
          >
            Comptoir
          </motion.h1>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
