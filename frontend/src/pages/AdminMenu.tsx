import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
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

interface MenuItem {
  id: string
  name: string
  price: number
  imageUrl: string | null
  available: boolean
}

interface Category {
  id: string
  name: string
  menuItems: MenuItem[]
}

function formatPKR(amount: number) {
  return `Rs. ${amount.toLocaleString('en-PK')}`
}

export default function AdminMenu() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data, loading, error, refetch } = useQuery<{ categories: Category[] }>(GET_CATEGORIES)

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

  if (!user || user.role !== 'ADMIN') {
    navigate('/')
    return null
  }
  if (loading) return <div className="p-8 text-text-secondary">Loading menu...</div>
  if (error) return <div className="p-8 text-accent">Failed to load: {error.message}</div>

  const categories = data?.categories ?? []

  async function handleCreateCategory() {
    if (!newCategoryName.trim()) return
    await createCategory({ variables: { name: newCategoryName } })
    setNewCategoryName('')
    refetch()
  }

  async function handleCreateItem() {
    if (!newItemName.trim() || !newItemPrice || !newItemCategoryId) return
    setUploading(true)
    try {
      let imageUrl: string | undefined
      if (newItemFile) {
        imageUrl = await uploadToCloudinary(newItemFile)
      }
      await createMenuItem({
        variables: {
          name: newItemName,
          price: parseFloat(newItemPrice),
          categoryId: newItemCategoryId,
          imageUrl,
        },
      })
      setNewItemName('')
      setNewItemPrice('')
      setNewItemCategoryId('')
      setNewItemFile(null)
      setShowNewItemForm(false)
      refetch()
    } finally {
      setUploading(false)
    }
  }

  async function handleDeleteCategory(id: string, name: string) {
    if (!confirm(`Delete category "${name}"? It must be empty first.`)) return
    try {
      await deleteCategory({ variables: { id } })
      refetch()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete category')
    }
  }

  function startEdit(item: MenuItem) {
    setEditingId(item.id)
    setEditName(item.name)
    setEditPrice(String(item.price))
    setEditFile(null)
  }

  async function handleSaveEdit(id: string) {
    setUploading(true)
    try {
      let imageUrl: string | undefined
      if (editFile) {
        imageUrl = await uploadToCloudinary(editFile)
      }
      await updateMenuItem({
        variables: {
          id,
          name: editName,
          price: parseFloat(editPrice),
          ...(imageUrl ? { imageUrl } : {}),
        },
      })
      setEditingId(null)
      refetch()
    } finally {
      setUploading(false)
    }
  }

  async function handleToggleAvailable(item: MenuItem) {
    await updateMenuItem({ variables: { id: item.id, available: !item.available } })
    refetch()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this item permanently?')) return
    await deleteMenuItem({ variables: { id } })
    refetch()
  }

  return (
    <div className="min-h-screen bg-bg px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold text-text">Manage Menu</h1>
        <button
          onClick={() => navigate('/admin')}
          className="text-sm text-text-secondary hover:text-text"
        >
          ← Back to orders
        </button>
      </div>

      <div className="bg-surface border border-border rounded-[10px] p-4 mb-8 max-w-md flex gap-2">
        <input
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="New category name"
          className="flex-1 border border-border rounded-[6px] px-3 py-2 text-sm bg-transparent text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
        <button
          onClick={handleCreateCategory}
          className="bg-accent hover:bg-accent-hover text-white text-sm px-4 py-2 rounded-[6px]"
        >
          Add category
        </button>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowNewItemForm((s) => !s)}
        className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-[6px] mb-6"
      >
        {showNewItemForm ? 'Cancel' : '+ Add menu item'}
      </motion.button>

      {showNewItemForm && (
        <div className="bg-surface border border-border rounded-[10px] p-5 mb-8 max-w-md space-y-3">
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
      )}

      <div className="space-y-10">
        {categories.map((cat) => (
          <section key={cat.id}>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="font-display text-lg text-accent">{cat.name}</h2>
              <button
                onClick={() => handleDeleteCategory(cat.id, cat.name)}
                className="text-xs text-text-secondary hover:text-accent border border-border rounded-full px-2 py-0.5"
              >
                Delete category
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cat.menuItems.map((item) => (
                <div key={item.id} className="bg-surface border border-border rounded-[10px] p-4">
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
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <p className="text-text font-medium mb-1">{item.name}</p>
                      <p className="text-accent text-sm font-medium mb-3">{formatPKR(item.price)}</p>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-text-secondary">
                          {item.available ? 'Available' : 'Unavailable'}
                        </span>
                        <button
                          onClick={() => handleToggleAvailable(item)}
                          className={`text-xs px-2 py-1 rounded-full border ${item.available
                            ? 'border-success text-success'
                            : 'border-border text-text-secondary'
                            }`}
                        >
                          Toggle
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(item)}
                          className="flex-1 border border-border text-text text-sm py-1.5 rounded-[6px]"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="flex-1 border border-accent text-accent text-sm py-1.5 rounded-[6px]"
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
    </div>
  )
}