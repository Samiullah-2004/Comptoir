import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion, type PanInfo } from 'framer-motion'

interface Slide {
  eyebrow: string
  title: string
  description: string
  imageUrl: string
}

const CLOUDINARY = 'https://res.cloudinary.com/uzxk7ify/image/upload/f_auto,q_auto,w_1600'

const slides: Slide[] = [
  {
    eyebrow: 'New arrival',
    title: 'Crown Crust Pizza is here',
    description: 'Stuffed crust, loaded with flavor in every single bite. Made fresh, served hot.',
    imageUrl: `${CLOUDINARY}/Crown_Crust_Pizza_Hero`,
  },
  {
    eyebrow: 'Fan favourite',
    title: 'Jumbo Zinger',
    description: 'Extra crispy, extra spicy, extra everything. Our biggest zinger burger yet.',
    imageUrl: `${CLOUDINARY}/Jumbo_Zinger_Hero`,
  },
  {
    eyebrow: 'Off the grill',
    title: 'Bar-B-Q Platters',
    description: 'Fresh off the grill, every order, made with our signature spice blend.',
    imageUrl: `${CLOUDINARY}/Chicken_Tikka_Boti_Hero`,
  },
  {
    eyebrow: 'Chef’s special',
    title: 'Creamy Pasta Special',
    description: 'Rich, creamy, and loaded with flavor. A Comptoir favorite, made fresh daily.',
    imageUrl: `${CLOUDINARY}/Macroni_Creamy_Pasta_Hero`,
  },
]

const INTERVAL_MS = 5500
const SWIPE_THRESHOLD = 60

const textVariants = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

export default function HeroSlider() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  const next = useCallback(() => setIndex((i) => (i + 1) % slides.length), [])
  const prev = useCallback(() => setIndex((i) => (i - 1 + slides.length) % slides.length), [])

  // Warm the browser cache so later slides don't pop in.
  useEffect(() => {
    slides.slice(1).forEach((s) => {
      const img = new Image()
      img.src = s.imageUrl
    })
  }, [])

  useEffect(() => {
    if (paused) return
    const timer = setTimeout(next, INTERVAL_MS)
    return () => clearTimeout(timer)
  }, [index, paused, next])

  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  function scrollToMenu() {
    document.getElementById('menu-categories')?.scrollIntoView({ behavior: 'smooth' })
  }

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < -SWIPE_THRESHOLD) next()
    else if (info.offset.x > SWIPE_THRESHOLD) prev()
  }

  const slide = slides[index]

  return (
    <section
      className="relative w-full h-64 sm:h-80 md:h-[440px] lg:h-[500px] rounded-[18px] overflow-hidden mb-6 sm:mb-10 bg-neutral-900 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.45)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured dishes"
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="absolute inset-0"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={handleDragEnd}
        >
          {/* Ken Burns: a slow zoom keeps the still photo feeling alive. */}
          <motion.img
            src={slide.imageUrl}
            alt={slide.title}
            draggable={false}
            initial={{ scale: 1.12 }}
            animate={{ scale: 1 }}
            transition={{ duration: INTERVAL_MS / 1000 + 1, ease: 'linear' }}
            className="w-full h-full object-cover select-none"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent" />

          <div className="absolute inset-0 flex flex-col justify-center px-5 sm:px-10 md:px-16 max-w-[92%] sm:max-w-lg md:max-w-2xl">
            <motion.span
              custom={0}
              variants={textVariants}
              initial="hidden"
              animate="show"
              className="inline-flex w-fit items-center gap-1.5 text-white/95 text-[10px] sm:text-xs font-semibold mb-2 sm:mb-3 uppercase tracking-[0.18em] bg-white/15 backdrop-blur-md border border-white/20 rounded-full px-2.5 py-1"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff9a62]" />
              {slide.eyebrow}
            </motion.span>
            <motion.h2
              custom={1}
              variants={textVariants}
              initial="hidden"
              animate="show"
              className="font-display text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-white mb-2 sm:mb-4 leading-[1.1] drop-shadow-lg"
            >
              {slide.title}
            </motion.h2>
            <motion.p
              custom={2}
              variants={textVariants}
              initial="hidden"
              animate="show"
              className="text-white/85 text-xs sm:text-base md:text-lg mb-4 sm:mb-6 line-clamp-2 sm:line-clamp-none max-w-md"
            >
              {slide.description}
            </motion.p>
            <motion.button
              custom={3}
              variants={textVariants}
              initial="hidden"
              animate="show"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={scrollToMenu}
              className="group w-fit inline-flex items-center gap-2 bg-white text-neutral-900 text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-lg"
            >
              Explore the menu
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>

      <button
        onClick={prev}
        aria-label="Previous slide"
        className="hidden sm:flex absolute left-3 md:left-4 top-1/2 -translate-y-1/2 bg-white/15 hover:bg-white/30 text-white w-10 h-10 rounded-full items-center justify-center backdrop-blur-md border border-white/20 transition-colors z-20 text-xl"
      >
        ‹
      </button>
      <button
        onClick={next}
        aria-label="Next slide"
        className="hidden sm:flex absolute right-3 md:right-4 top-1/2 -translate-y-1/2 bg-white/15 hover:bg-white/30 text-white w-10 h-10 rounded-full items-center justify-center backdrop-blur-md border border-white/20 transition-colors z-20 text-xl"
      >
        ›
      </button>

      <div className="absolute bottom-4 sm:bottom-6 left-5 sm:left-10 md:left-16 flex gap-1.5 z-20">
        {slides.map((s, i) => (
          <button
            key={s.title}
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === index}
            className={`relative h-1.5 rounded-full overflow-hidden transition-all duration-300 ${i === index ? 'w-10 bg-white/30' : 'w-1.5 bg-white/40 hover:bg-white/70'}`}
          >
            {i === index && (
              <motion.span
                key={`${index}-${paused}`}
                className="absolute inset-y-0 left-0 bg-white rounded-full"
                initial={{ width: paused ? '100%' : '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: paused ? 0 : INTERVAL_MS / 1000, ease: 'linear' }}
              />
            )}
          </button>
        ))}
      </div>
    </section>
  )
}
