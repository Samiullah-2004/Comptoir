import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface Slide {
  title: string
  description: string
  imageUrl: string
}

const slides: Slide[] = [
  {
    title: 'Crown Crust Pizza is here',
    description: 'Stuffed crust, loaded with flavor in every single bite. Made fresh, served hot.',
    imageUrl: 'https://res.cloudinary.com/uzxk7ify/image/upload/Crown_Crust_Pizza_Hero',
  },
  {
    title: 'Jumbo Zinger',
    description: 'Extra crispy, extra spicy, extra everything. Our biggest zinger burger yet.',
    imageUrl: 'https://res.cloudinary.com/uzxk7ify/image/upload/Jumbo_Zinger_Hero',
  },
  {
    title: 'Bar-B-Q Platters',
    description: 'Fresh off the grill, every order, made with our signature spice blend.',
    imageUrl: 'https://res.cloudinary.com/uzxk7ify/image/upload/Chicken_Tikka_Boti_Hero',
  },
  {
    title: 'Creamy Pasta Special',
    description: 'Rich, creamy, and loaded with flavor. A Comptoir favorite, made fresh daily.',
    imageUrl: 'https://res.cloudinary.com/uzxk7ify/image/upload/Macroni_Creamy_Pasta_Hero',
  },
]

export default function HeroSlider() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  function goTo(i: number) {
    setIndex(i)
  }

  function prev() {
    setIndex((i) => (i - 1 + slides.length) % slides.length)
  }

  function next() {
    setIndex((i) => (i + 1) % slides.length)
  }

  const slide = slides[index]

  return (
    <div className="relative w-full h-80 sm:h-[420px] rounded-[12px] overflow-hidden mb-8">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <img
            src={slide.imageUrl}
            alt={slide.title}
            className="w-full h-full object-cover"
          />

          <div className="absolute inset-0 flex flex-col justify-center px-8 sm:px-14 max-w-xl">
            <motion.p
              key={`eyebrow-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-accent-dark text-sm font-medium mb-2 uppercase tracking-wide"
            >
              Limited time
            </motion.p>
            <motion.h2
              key={`title-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="font-display text-3xl sm:text-4xl font-semibold text-white mb-3 leading-tight"
            >
              {slide.title}
            </motion.h2>
            <motion.p
              key={`desc-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white/85 text-base mb-5"
            >
              {slide.description}
            </motion.p>
            <motion.button
              key={`cta-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="bg-accent hover:bg-accent-hover text-white px-6 py-2.5 rounded-[6px] text-sm font-medium w-fit"
            >
              Order Now
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>

      <button
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/15 hover:bg-white/25 text-white w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors z-20"
      >
        ‹
      </button>
      <button
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/15 hover:bg-white/25 text-white w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors z-20"
      >
        ›
      </button>

      <div className="absolute bottom-4 left-8 sm:left-14 flex gap-1.5 z-20">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`w-2 h-2 rounded-full transition-all ${
              i === index ? 'bg-white w-5' : 'bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  )
}