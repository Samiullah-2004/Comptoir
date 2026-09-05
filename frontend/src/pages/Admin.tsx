import { useEffect, useState } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { useNavigate } from 'react-router-dom'
import { GET_ALL_ORDERS } from '../graphql/queries'
import { UPDATE_ORDER_STATUS } from '../graphql/mutations'
import { useAuth } from '../context/AuthContext'
import { socket } from '../lib/socket'

interface OrderItem {
  quantity: number
  menuItem: { name: string }
}

interface Order {
  id: string
  status: string
  total: number
  createdAt: string
  user: { name: string; email: string }
  items: OrderItem[]
}

function formatPKR(amount: number) {
  return `Rs. ${amount.toLocaleString('en-PK')}`
}

const STATUS_FLOW = ['PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED']

const statusColors: Record<string, string> = {
  PENDING: 'text-text-secondary',
  PREPARING: 'text-accent',
  READY: 'text-success',
  COMPLETED: 'text-success',
  CANCELLED: 'text-accent',
}

export default function Admin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data, loading, error, refetch } = useQuery<{ allOrders: Order[] }>(GET_ALL_ORDERS, {
    skip: !user || user.role !== 'ADMIN',
  })
  const [updateStatus] = useMutation(UPDATE_ORDER_STATUS)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    if (user.role !== 'ADMIN') {
      navigate('/')
    }
  }, [user, navigate])

  useEffect(() => {
    socket.connect()
    function handleChange() {
      refetch()
    }
    socket.on('orderStatusUpdated', handleChange)
    socket.on('newOrder', handleChange)
    return () => {
      socket.off('orderStatusUpdated', handleChange)
      socket.off('newOrder', handleChange)
    }
  }, [refetch])

  if (!user || user.role !== 'ADMIN') return null
  if (loading) return <div className="p-8 text-text-secondary">Loading orders...</div>
  if (error) return <div className="p-8 text-accent">Failed to load orders: {error.message}</div>

  const orders = data?.allOrders ?? []

  async function handleStatusChange(orderId: string, status: string) {
    await updateStatus({ variables: { orderId, status } })
  }

  return (
    <div className="min-h-screen bg-bg px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold text-text">Admin dashboard</h1>
        <button
          onClick={() => navigate('/admin/menu')}
          className="bg-accent hover:bg-accent-hover text-white text-sm px-4 py-2 rounded-[6px]"
        >
          Manage Menu
        </button>
      </div>

      <div className="space-y-4 max-w-2xl">
        {orders.map((order) => (
          <div key={order.id} className="bg-surface border border-border rounded-[10px] p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-text font-medium">{order.user.name}</p>
                <p className="text-text-secondary text-sm">{order.user.email}</p>
              </div>
              <span className={`text-sm font-medium ${statusColors[order.status] || 'text-text'}`}>
                {order.status}
              </span>
            </div>

            <ul className="text-text text-sm mb-3">
              {order.items.map((item, i) => (
                <li key={i}>{item.quantity} × {item.menuItem.name}</li>
              ))}
            </ul>

            <div className="flex items-center justify-between">
              <span className="text-accent font-medium">{formatPKR(order.total)}</span>
              <select
                value={order.status}
                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                className="border border-border rounded-[6px] px-2 py-1 text-sm bg-transparent text-text"
              >
                {STATUS_FLOW.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}