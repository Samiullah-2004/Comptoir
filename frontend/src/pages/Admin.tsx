import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { GET_ALL_ORDERS } from '../graphql/queries'
import { UPDATE_ORDER_STATUS } from '../graphql/mutations'
import { useAuth } from '../context/AuthContext'
import { socket } from '../lib/socket'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import Header from '../components/Header'
import ScrollProgressIndicator from '../components/ScrollProgressIndicator'
import { usePageTitle } from '../hooks/usePageTitle'

interface OrderItem {
  quantity: number
  menuItem: { name: string; imageUrl: string | null }
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

const statusBg: Record<string, string> = {
  PENDING: 'bg-border',
  PREPARING: 'bg-accent/15',
  READY: 'bg-success/15',
  COMPLETED: 'bg-success/15',
  CANCELLED: 'bg-accent/15',
}

export default function Admin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data, loading, error, refetch } = useQuery<{ allOrders: Order[] }>(GET_ALL_ORDERS, {
    skip: !user || user.role !== 'ADMIN',
  })
  const [updateStatus] = useMutation(UPDATE_ORDER_STATUS)
  const [filter, setFilter] = useState<string>('ALL')
  usePageTitle('Admin Dashboard')

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

  const orders = useMemo(() => data?.allOrders ?? [], [data])

  const stats = useMemo(() => {
    const today = new Date().toDateString()
    const todaysOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === today)
    const pending = orders.filter((o) => o.status === 'PENDING' || o.status === 'PREPARING')
    const todaysRevenue = todaysOrders.reduce((sum, o) => sum + o.total, 0)

    return {
      totalOrders: orders.length,
      todaysOrders: todaysOrders.length,
      pendingCount: pending.length,
      todaysRevenue,
    }
  }, [orders])

  const bestSellers = useMemo(() => {
    const counts: Record<string, number> = {}
    orders.forEach((order) => {
      order.items.forEach((item) => {
        counts[item.menuItem.name] = (counts[item.menuItem.name] || 0) + item.quantity
      })
    })
    return Object.entries(counts)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)
  }, [orders])

  if (!user || user.role !== 'ADMIN') return null
  if (loading) return <div className="p-8 text-text-secondary">Loading orders...</div>
  if (error) return <div className="p-8 text-accent">Failed to load orders: {error.message}</div>

  async function handleStatusChange(orderId: string, status: string) {
    await updateStatus({ variables: { orderId, status } })
  }

  const filteredOrders = filter === 'ALL' ? orders : orders.filter((o) => o.status === filter)

  return (
    <div className="min-h-screen bg-bg">
      <Header />
      <ScrollProgressIndicator />
      <div className="px-4 sm:px-8 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
          <h1 className="font-display text-xl sm:text-2xl font-semibold text-text">Admin dashboard</h1>
          <button
            onClick={() => navigate('/admin/menu')}
            className="bg-accent hover:bg-accent-hover text-white text-sm px-4 py-2 rounded-[6px] self-start sm:self-auto"
          >
            Manage Menu
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 mb-6 sm:mb-8 max-w-3xl">
          {[
            { label: 'Total orders', value: stats.totalOrders },
            { label: "Today's orders", value: stats.todaysOrders },
            { label: 'Pending / Preparing', value: stats.pendingCount },
            { label: "Today's revenue", value: formatPKR(stats.todaysRevenue) },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-surface border border-border rounded-[10px] p-3 sm:p-4"
            >
              <p className="text-text-secondary text-[10px] sm:text-xs mb-1">{stat.label}</p>
              <p className="text-text text-base sm:text-xl font-semibold">{stat.value}</p>
            </motion.div>
          ))}
        </div>
        {bestSellers.length > 0 && (
          <div className="bg-surface border border-border rounded-[10px] p-4 sm:p-5 mb-6 sm:mb-8 max-w-2xl">
            <h2 className="font-display text-base sm:text-lg text-text mb-4">Best sellers</h2>
            <ResponsiveContainer width="100%" height={180} className="sm:!h-[220px]">
              <BarChart data={bestSellers} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  cursor={{ fill: 'var(--color-border)', opacity: 0.3 }}
                />
                <Bar dataKey="qty" fill="var(--color-accent)" radius={[0, 6, 6, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="flex gap-2 mb-5 sm:mb-6 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {['ALL', ...STATUS_FLOW].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm whitespace-nowrap border transition-all ${filter === s
                ? 'bg-accent text-white border-accent'
                : 'bg-surface text-text-secondary border-border hover:border-accent hover:text-text'
                }`}
            >
              {s === 'ALL' ? 'All' : s}
            </button>
          ))}
        </div>

        <div className="space-y-3 sm:space-y-4 max-w-2xl">
          <AnimatePresence initial={false}>
            {filteredOrders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="bg-surface border border-border rounded-[10px] p-3 sm:p-4"
              >
                <div className="flex items-center justify-between mb-3 gap-2">
                  <div className="min-w-0">
                    <p className="text-text text-sm sm:text-base font-medium truncate">{order.user.name}</p>
                    <p className="text-text-secondary text-xs sm:text-sm truncate">{order.user.email}</p>
                    <p className="text-text-secondary text-[10px] sm:text-xs mt-0.5">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className={`text-[10px] sm:text-xs font-medium px-2 sm:px-2.5 py-1 rounded-full flex-shrink-0 ${statusBg[order.status]} ${statusColors[order.status] || 'text-text'}`}>
                    {order.status}
                  </span>
                </div>

                <div className="flex gap-2 mb-3 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 bg-bg border border-border rounded-[8px] px-2 py-1.5 whitespace-nowrap">
                      {item.menuItem.imageUrl ? (
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[4px] overflow-hidden bg-white border border-border flex-shrink-0">
                          <img src={item.menuItem.imageUrl} alt={item.menuItem.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[4px] bg-border flex-shrink-0" />
                      )}
                      <span className="text-text text-[11px] sm:text-xs">{item.quantity}× {item.menuItem.name}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-accent text-sm sm:text-base font-medium">{formatPKR(order.total)}</span>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    className="border border-border rounded-[6px] px-2 py-1 text-xs sm:text-sm bg-transparent text-text"
                  >
                    {STATUS_FLOW.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredOrders.length === 0 && (
            <p className="text-text-secondary text-sm">No orders match this filter.</p>
          )}
        </div>
      </div>
    </div>
  )
}