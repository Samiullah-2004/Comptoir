import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const HERO_IMAGE = 'https://res.cloudinary.com/uzxk7ify/image/upload/f_auto,q_auto,w_1200/Jumbo_Zinger_Hero'

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
}

export default function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-bg grid lg:grid-cols-2">
      <div className="hidden lg:block relative overflow-hidden">
        <motion.img
          src={HERO_IMAGE}
          alt=""
          initial={{ scale: 1.15 }}
          animate={{ scale: 1 }}
          transition={{ duration: 6, ease: 'easeOut' }}
          className="absolute inset-0 w-full h-full object-cover object-[70%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="absolute bottom-12 left-12 right-12 text-white"
        >
          <p className="font-display text-4xl xl:text-5xl font-semibold leading-tight mb-3">
            Good food,<br />
            <span className="italic">no waiting around.</span>
          </p>
          <p className="text-white/80 max-w-md">
            Order in seconds and follow every step — from the kitchen to your door — in real time.
          </p>
        </motion.div>
      </div>

      <div className="flex flex-col px-4 sm:px-8 py-6">
        <Link to="/" className="flex items-center gap-2 w-fit group">
          <motion.img
            whileHover={{ rotate: -12 }}
            src="/logo-mark.png"
            alt=""
            className="w-8 h-8 object-contain"
          />
          <span className="font-display text-xl font-semibold text-text">Comptoir</span>
        </Link>

        <div className="flex-1 flex items-center justify-center py-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-sm"
          >
            <h1 className="font-display text-3xl font-semibold text-text mb-1.5">{title}</h1>
            <p className="text-text-secondary mb-8">{subtitle}</p>
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

interface FieldProps {
  id: string
  label: string
  type?: string
  value: string
  onChange: (value: string) => void
  autoComplete?: string
  hint?: string
}

export function Field({ id, label, type = 'text', value, onChange, autoComplete, hint }: FieldProps) {
  const [reveal, setReveal] = useState(false)
  const isPassword = type === 'password'
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm text-text-secondary mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && reveal ? 'text' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required
          className={`input-field ${isPassword ? 'pr-16' : ''}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-text-secondary hover:text-text px-2 py-1"
            aria-label={reveal ? 'Hide password' : 'Show password'}
          >
            {reveal ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
      {hint && <p className="text-xs text-text-secondary mt-1.5">{hint}</p>}
    </div>
  )
}

export function SubmitButton({ loading, children, loadingText }: { loading: boolean; children: ReactNode; loadingText: string }) {
  return (
    <motion.button
      type="submit"
      disabled={loading}
      whileHover={loading ? undefined : { scale: 1.02 }}
      whileTap={loading ? undefined : { scale: 0.98 }}
      className="w-full bg-accent hover:bg-accent-hover text-white rounded-full py-3 font-medium disabled:opacity-60 flex items-center justify-center gap-2 transition-colors mt-2"
    >
      {loading && <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
      {loading ? loadingText : children}
    </motion.button>
  )
}

export function FormError({ message }: { message: string }) {
  if (!message) return null
  return (
    <motion.p
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: [0, -6, 6, -3, 0] }}
      transition={{ duration: 0.35 }}
      className="text-accent-fg text-sm mb-4 bg-accent/10 border border-accent/20 rounded-[8px] px-3 py-2"
      role="alert"
    >
      {message}
    </motion.p>
  )
}
