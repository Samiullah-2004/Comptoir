import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-border mt-16 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 grid gap-8 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <img src="/logo-mark.png" alt="" className="w-7 h-7 object-contain" />
            <span className="font-display text-lg font-semibold text-text">Comptoir</span>
          </div>
          <p className="text-sm text-text-secondary max-w-xs">
            Fresh food, made to order. Browse the menu, check out in seconds, and watch your order come together live.
          </p>
        </div>

        <div className="text-sm">
          <p className="text-text font-medium mb-3">Explore</p>
          <ul className="space-y-2 text-text-secondary">
            <li><Link to="/" className="hover:text-accent-fg transition-colors">Menu</Link></li>
            <li><Link to="/cart" className="hover:text-accent-fg transition-colors">Cart</Link></li>
            <li><Link to="/orders" className="hover:text-accent-fg transition-colors">Track an order</Link></li>
          </ul>
        </div>

        <div className="text-sm">
          <p className="text-text font-medium mb-3">Built with</p>
          <div className="flex flex-wrap gap-1.5">
            {['React 19', 'TypeScript', 'GraphQL', 'Prisma', 'PostgreSQL', 'Socket.IO', 'Stripe', 'Framer Motion'].map((t) => (
              <span key={t} className="text-xs border border-border rounded-full px-2.5 py-1 text-text-secondary">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex flex-col sm:flex-row gap-2 justify-between text-xs text-text-secondary">
          <span>© {new Date().getFullYear()} Comptoir. A portfolio project by Samiullah Akram.</span>
          <a
            href="https://github.com/Samiullah-2004/Comptoir"
            target="_blank"
            rel="noreferrer"
            className="hover:text-accent-fg transition-colors"
          >
            View source on GitHub →
          </a>
        </div>
      </div>
    </footer>
  )
}
