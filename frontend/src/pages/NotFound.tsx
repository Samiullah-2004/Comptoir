import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Header from '../components/Header'
import { usePageTitle } from '../hooks/usePageTitle'

export default function NotFound() {
  usePageTitle('Page not found')
  return (
    <div className="min-h-screen bg-bg">
      <Header />
      <div className="flex flex-col items-center justify-center text-center px-4 py-24">
        <motion.p
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12 }}
          className="font-display text-8xl sm:text-9xl font-semibold text-accent-fg mb-4"
        >
          404
        </motion.p>
        <h1 className="font-display text-2xl text-text mb-2">This dish isn't on the menu</h1>
        <p className="text-text-secondary mb-8">The page you're looking for doesn't exist or has moved.</p>
        <Link
          to="/"
          className="bg-accent hover:bg-accent-hover text-white px-6 py-2.5 rounded-full text-sm font-medium transition-colors"
        >
          Back to the menu
        </Link>
      </div>
    </div>
  )
}
