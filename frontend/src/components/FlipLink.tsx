import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface FlipLinkProps {
  children: ReactNode
}

export default function FlipLink({ children }: FlipLinkProps) {
  return (
    <span className="relative overflow-hidden inline-block h-5 align-middle">
      <motion.span
        className="flex flex-col"
        initial={{ y: 0 }}
        whileHover={{ y: -20 }}
        transition={{ type: 'tween', duration: 0.18, ease: 'easeInOut' }}
      >
        <span className="h-5 leading-5 block">{children}</span>
        <span className="h-5 leading-5 block">{children}</span>
      </motion.span>
    </span>
  )
}