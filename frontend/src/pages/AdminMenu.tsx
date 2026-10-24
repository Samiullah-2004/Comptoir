import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { Navigate, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { GET_CATEGORIES } from '../graphql/queries'
import {
  CREATE_CATEGORY,
  DELETE_CATEGORY,
  CREATE_MENU_ITEM,
  UPDATE_MENU_ITEM,
  DELETE_MENU_ITEM,
} from '../graphql/mutations'
import { useAuth } from '../context/AuthContext'
import { uploadToCloudinary } from '../lib/cloudinary'
import Header from '../components/Header'
import Toast from '../components/Toast'
import { ErrorState, MenuSkeleton } from '../components/StatusViews'
import { usePageTitle } from '../hooks/usePageTitle'
import { formatPKR } from '../lib/pricing'
import { optimizedImage } from '../lib/image'
import { friendlyError } from '../lib/errors'
import type { Category, MenuItem } from '../types'

export default function AdminMenu() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'ADMIN'
  const { data, loading, error, refetch } = useQuery<{ categories: Category[] }>(GET_CATEGORIES, { skip: !isAdmin })

  const [createCategory] = useMutation(CREATE_CATEGORY)
  const [createMenuItem] = useMutation(CREATE_MENU_ITEM)
  const [updateMenuItem] = useMutation(UPDATE_MENU_ITEM)
  const [deleteMenuItem] = useMutation(DELETE_MENU_ITEM)
  const [deleteCategory] = useMutation(DELETE_CATEGORY)

  const [showNewItemForm, setShowNewItemForm] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [newItemPrice, setNewItemPrice] = useState('')
  const [newItemCategoryId, setNewItemCategoryId] = useState('')
  const [newItemFile, setNewItemFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const [newCategoryName, setNewCategoryName] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editFile, setEditFile] = useState<File | null>(null)
  const [toast, setToast] = useState('')
  usePageTitle('Manage Menu')

  if (!user) return <Navigate to="/login" replace state={{ from: '/admin/menu' }} />
  if (!isAdmin) return <Navigate to="/" replace />

  const categories = data?.categories ?? []

  function notify(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2500)
  }

  // Every admin action goes through here so failures surface as a toast
  // instead of an unhandled promise rejection.
  async function run(action: () => Promise<unknown>, success: string) {
    try {
      await action()
      await refetch()
      notify(success)
      return true
    } catch (err) {
      notify(friendlyError(err))
      return false
    }
  }

  async function handleCreateCategory() {
    if (!newCategoryName.trim()) return
    const ok = await run(() => createCategory({ variables: { name: newCategoryName.trim() } }), 'Category added')
    if (ok) setNewCategoryName('')
  }

  async function handleCreateItem() {
    if (!newItemName.trim() || !newItemCategoryId) {
      notify('Give the item a name and a category')
      return
    }
    const price = parseFloat(newItemPrice)
    if (!(price > 0)) {
      notify('Enter a price greater than zero')
      return
    }
    setUploading(true)
    try {
      const ok = await run(async () => {
        const imageUrl = newItemFile ? await uploadToCloudinary(newItemFile) : undefined
        await createMenuItem({
          variables: { name: newItemName.trim(), price, categoryId: newItemCategoryId, imageUrl },
        })
      }, `${newItemName.trim()} added to the menu`)
      if (ok) {
        setNewItemName('')
        setNewItemPrice('')
        setNewItemCategoryId('')
        setNewItemFile(null)
        setShowNewItemForm(false)
      }
    } finally {
      setUploading(false)
    }
  }

  async function handleDeleteCategory(id: string, name: string) {
    if (!confirm(`Delete category "${name}"? It must be empty first.`)) return
    await run(() => deleteCategory({ variables: { id } }), `Deleted ${name}`)
  }

  function startEdit(item: MenuItem) {
    setEditingId(item.id)
    setEditName(item.name)
    setEditPrice(String(item.price))
    setEditFile(null)
  }

  async function handleSaveEdit(id: string) {
    const price = parseFloat(editPrice)
    if (!editName.trim() || !(price > 0)) {
      notify('Name and a price above zero are required')
      return
    }
    setUploading(true)
    try {
      const ok = await run(async () => {
        const imageUrl = editFile ? await uploadToCloudinary(editFile) : undefined
        await updateMenuItem({
          variables: { id, name: editName.trim(), price, ...(imageUrl ? { imageUrl } : {}) },
        })
      }, 'Changes saved')
      if (ok) setEditingId(null)
    } finally {
      setUploading(false)
    }
  }

  async function handleToggleAvailable(item: MenuItem) {
    await run(
      () => updateMenuItem({ variables: { id: item.id, available: !item.available } }),
      `${item.name} is now ${item.available ? 'unavailable' : 'available'}`
    )
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this item permanently?')) return
    await run(() => deleteMenuItem({ variables: { id } }), 'Item deleted')
  }

  return (
    <div className="min-h-screen bg-bg">
      <Header />
      <main className="px-4 sm:px-8 py-5 sm:py-10 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-5 sm:mb-6">
          <h1 className="font-display text-xl sm:text-2xl font-semibold text-text">Manage Menu</h1>
          <button
            onClick={() => navigate('/admin')}
            className="text-sm text-text-secondary hover:text-text self-start sm:self-auto"
          >
            ← Back to orders
          </button>
        </div>

        <div className="bg-surface border border-border rounded-[10px] p-3 sm:p-4 mb-6 sm:mb-8 max-w-md flex flex-col sm:flex-row gap-2">
          <input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="New category name"
            className="flex-1 border border-border rounded-[6px] px-3 py-2 text-sm bg-transparent text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
          <button
            onClick={handleCreateCategory}
            className="bg-accent hover:bg-accent-hover text-white text-sm px-4 py-2 rounded-[6px] whitespace-nowrap"
          >
            Add category
          </button>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowNewItemForm((s) => !s)}
          className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-[6px] mb-5 sm:mb-6 text-sm sm:text-base"
        >
          {showNewItemForm ? 'Cancel' : '+ Add menu item'}
        </motion.button>

        <AnimatePresence initial={false}>
          {showNewItemForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
          <div className="bg-surface border border-border rounded-[10px] p-4 sm:p-5 mb-6 sm:mb-8 max-w-md space-y-3">
            <input
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Item name"
              className="w-full border border-border rounded-[6px] px-3 py-2 text-sm bg-transparent text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
            <input
              value={newItemPrice}
              onChange={(e) => setNewItemPrice(e.target.value)}
              placeholder="Price (PKR)"
              type="number"
              className="w-full border border-border rounded-[6px] px-3 py-2 text-sm bg-transparent text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
            <select
              value={newItemCategoryId}
              onChange={(e) => setNewItemCategoryId(e.target.value)}
              className="w-full border border-border rounded-[6px] px-3 py-2 text-sm bg-surface text-text"
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewItemFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-text-secondary"
            />
            <button
              onClick={handleCreateItem}
              disabled={uploading}
              className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white py-2 rounded-[6px] text-sm"
            >
              {uploading ? 'Uploading...' : 'Create item'}
            </button>
          </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading && !data && <MenuSkeleton cards={6} />}
        {error && !data && <ErrorState error={error} onRetry={() => refetch()} />}

        <div className="space-y-8 sm:space-y-10">
          {categories.map((cat) => (
            <section key={cat.id}>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
                <h2 className="font-display text-base sm:text-lg text-accent-fg">{cat.name}</h2>
                <button
                  onClick={() => handleDeleteCategory(cat.id, cat.name)}
                  className="text-xs text-text-secondary hover:text-accent-fg border border-border rounded-full px-2 py-0.5"
                >
                  Delete category
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {cat.menuItems.map((item) => (
                  <div key={item.id} className="bg-surface border border-border rounded-[10px] p-3 sm:p-4">
                    {editingId === item.id ? (
                      <div className="space-y-2">
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full border border-border rounded-[6px] px-2 py-1 text-sm bg-transparent text-text"
                        />
                        <input
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          type="number"
                          className="w-full border border-border rounded-[6px] px-2 py-1 text-sm bg-transparent text-text"
                        />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setEditFile(e.target.files?.[0] ?? null)}
                          className="w-full text-xs text-text-secondary"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(item.id)}
                            disabled={uploading}
                            className="flex-1 bg-accent hover:bg-accent-hover text-white text-sm py-1.5 rounded-[6px]"
                          >
                            {uploading ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="flex-1 border border-border text-text text-sm py-1.5 rounded-[6px]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {item.imageUrl && (
                          <div className="w-full aspect-square rounded-[6px] overflow-hidden bg-white border border-border mb-3">
                            <img src={optimizedImage(item.imageUrl, 480) ?? undefined} alt={item.name} loading="lazy" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <p className="text-text text-sm sm:text-base font-medium mb-1">{item.name}</p>
                        <p className="text-accent-fg text-sm font-medium mb-3">{formatPKR(item.price)}</p>
                        <div className="flex items-center justify-between mb-3 gap-2">
                          <span className="text-xs text-text-secondary">
                            {item.available ? 'Available' : 'Unavailable'}
                          </span>
                          <button
                            role="switch"
                            aria-checked={item.available}
                            aria-label={`Toggle availability for ${item.name}`}
                            onClick={() => handleToggleAvailable(item)}
                            className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${item.available ? 'bg-success' : 'bg-border'}`}
                          >
                            <motion.span
                              layout
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow ${item.available ? 'right-1' : 'left-1'}`}
                            />
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(item)}
                            className="flex-1 border border-border text-text text-xs sm:text-sm py-1.5 rounded-[6px]"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="flex-1 border border-accent text-accent-fg text-xs sm:text-sm py-1.5 rounded-[6px]"
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
      <Toast message={toast} show={!!toast} />
    </div>
  )
}
