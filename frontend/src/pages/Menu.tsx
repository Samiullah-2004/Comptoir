import { useState, useRef, useEffect, useMemo, useCallback, useDeferredValue } from 'react'
import { useQuery } from '@apollo/client/react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { GET_CATEGORIES } from '../graphql/queries'
import { useCart } from '../context/CartContext'
import ProductModal from '../components/ProductModal'
import Toast from '../components/Toast'
import HeroSlider from '../components/HeroSlider'
import Counter from '../components/Counter'
import FlipLink from '../components/FlipLink'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ScrollProgressIndicator from '../components/ScrollProgressIndicator'
import { ErrorState, EmptyState, MenuSkeleton, SlowLoadingHint } from '../components/StatusViews'
import { usePageTitle } from '../hooks/usePageTitle'
import { formatPKR } from '../lib/pricing'
import { optimizedImage } from '../lib/image'
import type { Category, MenuItem } from '../types'

const TOAST_MS = 2200

export default function Menu() {
  const { data, loading, error, refetch } = useQuery<{ categories: Category[] }>(GET_CATEGORIES, {
    notifyOnNetworkStatusChange: true,
  })
  const { addItem } = useCart()
  const navigate = useNavigate()
  const [toastMsg, setToastMsg] = useState('')
  const [showToast, setShowToast] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const categoryScrollRef = useRef<HTMLDivElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const deferredSearch = useDeferredValue(searchQuery)
  // Suppresses scroll-spy while a chip click is smooth-scrolling the page.
  const programmaticScroll = useRef(false)
  usePageTitle('Menu')

  useEffect(() => () => clearTimeout(toastTimer.current), [])

  const allCategories = useMemo(() => data?.categories ?? [], [data])
  const searchLower = deferredSearch.trim().toLowerCase()

  const categories = useMemo(() => {
    const nonEmpty = allCategories.filter((c) => c.menuItems.length > 0)
    if (!searchLower) return nonEmpty
    return nonEmpty
      .map((cat) => ({
        ...cat,
        menuItems: cat.menuItems.filter(
          (item) => item.name.toLowerCase().includes(searchLower) || cat.name.toLowerCase().includes(searchLower)
        ),
      }))
      .filter((cat) => cat.menuItems.length > 0)
  }, [allCategories, searchLower])

  const resultCount = categories.reduce((n, c) => n + c.menuItems.length, 0)
  const categoryNameById = useMemo(
    () => Object.fromEntries(allCategories.flatMap((c) => c.menuItems.map((i) => [i.id, c.name]))),
    [allCategories]
  )

  function getQuantity(itemId: string) {
    return quantities[itemId] ?? 1
  }

  function setQuantity(itemId: string, qty: number) {
    setQuantities((prev) => ({ ...prev, [itemId]: qty }))
  }

  function notify(message: string) {
    setToastMsg(message)
    setShowToast(true)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setShowToast(false), TOAST_MS)
  }

  function handleAdd(item: MenuItem, qty = getQuantity(item.id)) {
    addItem({ menuItemId: item.id, name: item.name, price: item.price, imageUrl: item.imageUrl }, qty)
    notify(qty > 1 ? `${qty}× ${item.name} added` : `${item.name} added`)
    setQuantity(item.id, 1)
  }

  const closeModal = useCallback(() => setSelectedItem(null), [])

  function scrollCategories(direction: 'left' | 'right') {
    categoryScrollRef.current?.scrollBy({ left: direction === 'left' ? -240 : 240, behavior: 'smooth' })
  }

  function stickyOffset() {
    const headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 64
    const barH = document.getElementById('menu-categories')?.offsetHeight ?? 56
    return headerH + barH + 12
  }

  function jumpTo(categoryId: string | null) {
    setActiveCategory(categoryId)
    programmaticScroll.current = true
    const target = categoryId ? sectionRefs.current[categoryId] : document.getElementById('menu-sections')
    if (target) {
      const top = target.getBoundingClientRect().top + window.scrollY - stickyOffset()
      window.scrollTo({ top, behavior: 'smooth' })
    }
    window.setTimeout(() => { programmaticScroll.current = false }, 800)
  }

  // Scroll-spy: highlight the category whose section is under the sticky bar.
  useEffect(() => {
    if (categories.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (programmaticScroll.current) return
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length > 0) {
          setActiveCategory(visible[0].target.id.replace('section-', ''))
        }
      },
      { rootMargin: '-180px 0px -60% 0px', threshold: 0 }
    )
    categories.forEach((cat) => {
      const el = sectionRefs.current[cat.id]
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [categories])

  // Keep the highlighted chip visible inside the horizontally scrolling strip.
  useEffect(() => {
    const chip = activeCategory ? chipRefs.current[activeCategory] : null
    const strip = categoryScrollRef.current
    if (!chip || !strip) return
    const left = chip.offsetLeft - strip.clientWidth / 2 + chip.clientWidth / 2
    strip.scrollTo({ left, behavior: 'smooth' })
  }, [activeCategory])

  const chipClass = (active: boolean) =>
    `relative px-4 py-2 rounded-full text-sm whitespace-nowrap border transition-colors duration-200 ${active
      ? 'text-white border-accent'
      : 'bg-surface text-text-secondary border-border hover:border-accent hover:text-text'
    }`

  function renderItemCard(item: MenuItem, i: number) {
    const image = optimizedImage(item.imageUrl, 480)
    return (
      <motion.article
        key={item.id}
        layoutId={`card-${item.id}`}
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{
          default: { type: 'spring', stiffness: 300, damping: 30 },
          opacity: { duration: 0.35, delay: (i % 4) * 0.06 },
          y: { duration: 0.45, delay: (i % 4) * 0.06, ease: [0.22, 1, 0.36, 1] },
        }}
        whileHover={{ y: -6 }}
        onClick={() => setSelectedItem(item)}
        className={`group bg-surface border border-border rounded-[14px] p-2.5 sm:p-3.5 flex flex-col shadow-sm hover:shadow-xl hover:border-accent/40 transition-[box-shadow,border-color] duration-300 cursor-pointer ${!item.available ? 'opacity-70' : ''}`}
      >
        <motion.div
          layoutId={`image-${item.id}`}
          className="relative w-full aspect-square bg-white border border-border rounded-[10px] mb-3 overflow-hidden"
        >
          {image ? (
            <img
              src={image}
              alt={item.name}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-border flex items-center justify-center text-4xl">🍽️</div>
          )}
          {!item.available && (
            <span className="absolute top-2 left-2 bg-black/70 text-white text-[10px] uppercase tracking-wider px-2 py-1 rounded-full">
              Sold out
            </span>
          )}
          <span className="absolute bottom-2 right-2 bg-black/55 text-white text-[10px] px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm hidden sm:block">
            Quick view
          </span>
        </motion.div>
        <motion.h3 layoutId={`title-${item.id}`} className="text-text text-sm sm:text-base font-medium mb-1 line-clamp-2 leading-snug">
          {item.name}
        </motion.h3>
        <div className="mt-auto pt-1.5">
          <div className="flex items-center justify-between mb-2.5 gap-2">
            <motion.span layoutId={`price-${item.id}`} className="text-accent-fg font-semibold text-sm sm:text-base">
              {formatPKR(item.price)}
            </motion.span>
            <div className="hidden sm:block">
              <Counter value={getQuantity(item.id)} onChange={(q) => setQuantity(item.id, q)} />
            </div>
          </div>
          <motion.button
            whileHover={item.available ? { scale: 1.02 } : undefined}
            whileTap={item.available ? { scale: 0.95 } : undefined}
            disabled={!item.available}
            onClick={(e) => {
              e.stopPropagation()
              handleAdd(item)
            }}
            className="w-full bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:hover:bg-accent text-white text-sm px-3 py-2 rounded-full font-medium transition-colors"
          >
            Add
          </motion.button>
        </div>
      </motion.article>
    )
  }

  let content: React.ReactNode
  if (loading && !data) {
    content = (
      <>
        <SlowLoadingHint />
        <MenuSkeleton />
      </>
    )
  } else if (error && !data) {
    content = <ErrorState error={error} onRetry={() => refetch()} />
  } else if (categories.length === 0) {
    content = searchLower ? (
      <EmptyState
        emoji="🔍"
        title="No dishes found"
        description={`Nothing on the menu matches “${deferredSearch.trim()}”.`}
        action={
          <button onClick={() => setSearchQuery('')} className="text-accent-fg hover:opacity-75 font-medium">
            Clear search
          </button>
        }
      />
    ) : (
      <EmptyState emoji="🧑‍🍳" title="The menu is being prepared" description="Check back soon — new dishes are on the way." />
    )
  } else {
    content = (
      <>
        <div
          id="menu-categories"
          className="sticky z-30 bg-bg/85 backdrop-blur-xl py-3 mb-6 sm:mb-8 -mx-4 px-4 sm:-mx-8 sm:px-8 border-b border-transparent"
          style={{ top: 'var(--header-h, 64px)' }}
        >
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => scrollCategories('left')}
              aria-label="Scroll categories left"
              className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-surface border border-border text-text w-8 h-8 rounded-full items-center justify-center shadow-sm hover:border-accent transition-colors"
            >
              ‹
            </motion.button>

            <div ref={categoryScrollRef} className="flex gap-2 overflow-x-auto scroll-smooth sm:px-10 no-scrollbar">
              <button onClick={() => jumpTo(null)} className={chipClass(activeCategory === null)}>
                {activeCategory === null && (
                  <motion.span layoutId="chip-bg" className="absolute inset-0 bg-accent rounded-full -z-0" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
                )}
                <span className="relative z-10"><FlipLink>All</FlipLink></span>
              </button>
              {categories.map((cat) => {
                const active = activeCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    ref={(el) => { chipRefs.current[cat.id] = el }}
                    onClick={() => jumpTo(cat.id)}
                    className={chipClass(active)}
                  >
                    {active && (
                      <motion.span layoutId="chip-bg" className="absolute inset-0 bg-accent rounded-full -z-0" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
                    )}
                    <span className="relative z-10"><FlipLink>{cat.name}</FlipLink></span>
                  </button>
                )
              })}
            </div>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => scrollCategories('right')}
              aria-label="Scroll categories right"
              className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-surface border border-border text-text w-8 h-8 rounded-full items-center justify-center shadow-sm hover:border-accent transition-colors"
            >
              ›
            </motion.button>
          </div>
        </div>

        <AnimatePresence>
          {searchLower && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-sm text-text-secondary mb-5"
            >
              {resultCount} {resultCount === 1 ? 'dish' : 'dishes'} matching “{deferredSearch.trim()}”
            </motion.p>
          )}
        </AnimatePresence>

        <div id="menu-sections" className="space-y-12 sm:space-y-16">
          {categories.map((cat) => (
            <section
              key={cat.id}
              id={`section-${cat.id}`}
              ref={(el) => { sectionRefs.current[cat.id] = el }}
              aria-labelledby={`heading-${cat.id}`}
            >
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-3 mb-4 sm:mb-6"
              >
                <h2 id={`heading-${cat.id}`} className="font-display text-xl sm:text-2xl font-semibold text-accent-fg whitespace-nowrap">
                  {cat.name}
                </h2>
                <span className="text-xs text-text-secondary border border-border rounded-full px-2 py-0.5">
                  {cat.menuItems.length}
                </span>
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="h-px bg-border flex-1 origin-left"
                />
              </motion.div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-5">
                {cat.menuItems.map((item, i) => renderItemCard(item, i))}
              </div>
            </section>
          ))}
        </div>
      </>
    )
  }

  return (
    <div className="min-h-screen bg-bg">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <ScrollProgressIndicator />

      <main className="px-4 sm:px-8 py-4 sm:py-6 max-w-[1600px] mx-auto">
        <AnimatePresence initial={false}>
          {!searchQuery && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <HeroSlider />
            </motion.div>
          )}
        </AnimatePresence>

        {content}
      </main>

      <Footer />

      <AnimatePresence>
        {selectedItem && (
          <ProductModal
            item={selectedItem}
            categoryName={categoryNameById[selectedItem.id]}
            onClose={closeModal}
            onAdd={(item, qty) => handleAdd(item, qty)}
          />
        )}
      </AnimatePresence>
      <Toast
        message={toastMsg}
        show={showToast}
        action={{ label: 'View cart', onClick: () => navigate('/cart') }}
      />
    </div>
  )
}
