import { Component, lazy, Suspense, useCallback, useEffect, useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import cardModelUrl from './lanyard/card.glb'

// three.js + rapier are ~3 MB, so the card lives in its own chunk. Start
// fetching it (and the card model) the moment this module is evaluated so it
// downloads in parallel with the rest of the app instead of after first render.
const lanyardChunk = import('./lanyard/Lanyard')
// Swallow the early rejection here; lazy() retries once below if it failed.
lanyardChunk.catch(() => {})
const Lanyard = lazy(() => lanyardChunk.catch(() => import('./lanyard/Lanyard')))
fetch(cardModelUrl).catch(() => {})

// Customers coming back from Stripe have already seen the intro.
const SKIP_INTRO = new URLSearchParams(window.location.search).has('checkout')

// How long the card swings once it's on screen.
const CARD_MS = 3000
// Never hold visitors longer than this, even on a very slow connection.
const MAX_WAIT_MS = 9000
const FADE_SECONDS = 0.6

// If WebGL isn't available (old devices, some privacy modes) skip the card
// rather than crashing the app.
class CardBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onError()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

export default function Preloader() {
  const [visible, setVisible] = useState(!SKIP_INTRO)
  const [cardReady, setCardReady] = useState(false)
  const [cardFailed, setCardFailed] = useState(false)

  const handleReady = useCallback(() => setCardReady(true), [])
  const handleError = useCallback(() => setCardFailed(true), [])

  useEffect(() => {
    if (!visible) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [visible])

  // Once the card is rendering, give it its full moment on screen.
  useEffect(() => {
    if (!visible) return
    if (cardFailed) {
      const t = setTimeout(() => setVisible(false), 1200)
      return () => clearTimeout(t)
    }
    if (cardReady) {
      const t = setTimeout(() => setVisible(false), CARD_MS)
      return () => clearTimeout(t)
    }
  }, [visible, cardReady, cardFailed])

  // Safety net for very slow networks.
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), MAX_WAIT_MS)
    return () => clearTimeout(t)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05, filter: 'blur(8px)' }}
          transition={{ duration: FADE_SECONDS, ease: [0.65, 0, 0.35, 1] }}
          className="fixed inset-0 z-[100] bg-bg overflow-hidden h-dvh touch-none"
          onClick={() => setVisible(false)}
        >
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: cardReady ? 1 : 0 }}
            transition={{ duration: 0.5 }}
          >
            <CardBoundary onError={handleError}>
              <Suspense fallback={null}>
                <Lanyard
                  position={[0, 0, 18]}
                  gravity={[0, -40, 0]}
                  transparent
                  frontImage="/logo-mark.png"
                  imageFit="contain"
                  onReady={handleReady}
                />
              </Suspense>
            </CardBoundary>
          </motion.div>

          <div className="absolute left-1/2 -translate-x-1/2 bottom-[calc(2rem+env(safe-area-inset-bottom))] sm:bottom-10 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2 text-center pointer-events-none">
            <motion.h1
              initial={{ opacity: 0, y: 40, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.4 }}
              className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-semibold text-text tracking-wide whitespace-nowrap"
            >
              Comptoir
            </motion.h1>
            <div className="h-0.5 mt-3 mx-auto w-2/3 rounded-full bg-border overflow-hidden">
              {/* Indeterminate shimmer while the card loads, then a timed fill while it plays. */}
              {cardReady || cardFailed ? (
                <motion.div
                  key="fill"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: (cardFailed ? 1200 : CARD_MS) / 1000, ease: 'easeInOut' }}
                  className="h-full bg-accent origin-left"
                />
              ) : (
                <motion.div
                  key="loading"
                  animate={{ x: ['-100%', '250%'] }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                  className="h-full w-2/5 bg-accent/70 rounded-full"
                />
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
