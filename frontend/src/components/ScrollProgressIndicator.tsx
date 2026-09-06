import { useEffect, useRef } from 'react'

export default function ScrollProgressIndicator() {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleScroll() {
      if (!barRef.current) return
      const { scrollHeight, clientHeight } = document.documentElement
      const scrollableHeight = scrollHeight - clientHeight
      if (scrollableHeight <= 0) return

      const scrollProgress = (window.scrollY / scrollableHeight) * 100
      barRef.current.style.transform = `translateY(-${100 - scrollProgress}%)`
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])

  return (
    <div className="fixed top-1/2 right-4 md:right-6 -translate-y-1/2 w-1.5 h-[120px] rounded-full bg-border overflow-hidden z-40 pointer-events-none">
      <div
        ref={barRef}
        className="w-full bg-accent rounded-full h-full will-change-transform"
        style={{ transform: 'translateY(-100%)' }}
      />
    </div>
  )
}