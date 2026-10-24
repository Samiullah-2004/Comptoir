import { lazy, Suspense, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// three.js + rapier are ~3 MB; keep them out of the main bundle so the menu
// (and its data request) can start while the 3D card loads in parallel.
const Lanyard = lazy(() => import('./lanyard/Lanyard'))

const DISPLAY_MS = 2600
const FADE_SECONDS = 0.6
const SEEN_KEY = 'preloader-seen'

// Evaluated once at module load (not in a state initializer, which StrictMode
// would run twice and so mark the intro as seen before it ever showed).
const SHOW_ON_LOAD = (() => {
  try {
    if (sessionStorage.getItem(SEEN_KEY)) return false
    sessionStorage.setItem(SEEN_KEY, '1')
  } catch {
    // Storage blocked — just show it.
  }
  return true
})()

export default function Preloader() {
  // Only play the intro once per browser session; navigating back to the site
  // or refreshing shouldn't make visitors sit through it again.
  const [visible, setVisible] = useState(SHOW_ON_LOAD)
  const [reducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
    if (!visible) return
    document.body.style.overflow = 'hidden'
    const timer = setTimeout(() => setVisible(false), reducedMotion ? 900 : DISPLAY_MS)
    return () => {
      clearTimeout(timer)
      document.body.style.overflow = ''
    }
  }, [visible, reducedMotion])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05, filter: 'blur(8px)' }}
          transition={{ duration: FADE_SECONDS, ease: [0.65, 0, 0.35, 1] }}
          className="fixed inset-0 z-[100] bg-bg overflow-hidden h-dvh"
          onClick={() => setVisible(false)}
        >
          {!reducedMotion && (
            <div className="absolute inset-0">
              <Suspense fallback={null}>
                <Lanyard
                  position={[0, 0, 18]}
                  gravity={[0, -40, 0]}
                  transparent
                  frontImage="/logo-mark.png"
                  imageFit="contain"
                />
              </Suspense>
            </div>
          )}

          <div className="absolute left-1/2 -translate-x-1/2 bottom-8 sm:bottom-10 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2 text-center pointer-events-none">
            <motion.h1
              initial={{ opacity: 0, y: 40, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.4 }}
              className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-semibold text-text tracking-wide whitespace-nowrap"
            >
              Comptoir
            </motion.h1>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: (DISPLAY_MS - 400) / 1000, ease: 'easeInOut', delay: 0.2 }}
              className="h-0.5 bg-accent mt-3 mx-auto w-2/3 origin-left rounded-full"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
