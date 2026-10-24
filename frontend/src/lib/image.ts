// Ask Cloudinary for a right-sized, auto-format (WebP/AVIF) version of an
// image. Menu thumbnails were downloading full-resolution originals.
export function optimizedImage(url: string | null | undefined, width: number) {
  if (!url) return null
  const marker = '/image/upload/'
  if (!url.includes('res.cloudinary.com') || !url.includes(marker)) return url
  const [base, rest] = url.split(marker)
  // Don't stack transforms on a URL that already has some.
  if (/^[a-z]_[^/]+\//.test(rest)) return url
  return `${base}${marker}f_auto,q_auto,c_fill,w_${width},h_${width}/${rest}`
}
