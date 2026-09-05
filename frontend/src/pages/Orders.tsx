import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@apollo/client/react'
import { useNavigate } from 'react-router-dom'
import { GET_MY_ORDERS } from '../graphql/queries'
import { useAuth } from '../context/AuthContext'
import { socket } from '../lib/socket'
import { useCart } from '../context/CartContext'

interface OrderItem {
    quantity: number
    menuItem: { id: string; name: string; price: number; imageUrl: string | null; available: boolean }
}

interface Order {
    id: string
    status: string
    total: number
    createdAt: string
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

export default function Orders() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const { data, loading, error } = useQuery<{ myOrders: Order[] }>(GET_MY_ORDERS, {
        skip: !user,
    })
    const [liveStatuses, setLiveStatuses] = useState<Record<string, string>>({})
    const [filter, setFilter] = useState<string>('ALL')
    const STEPS = ['PENDING', 'PREPARING', 'READY', 'COMPLETED']
    const { addItem } = useCart()
    useEffect(() => {
        if (!user) {
            navigate('/login')
            return
        }

        socket.connect()

        function handleUpdate(payload: { orderId: string; status: string }) {
            setLiveStatuses((prev) => ({ ...prev, [payload.orderId]: payload.status }))
        }

        socket.on('orderStatusUpdated', handleUpdate)

        return () => {
            socket.off('orderStatusUpdated', handleUpdate)
        }
    }, [user, navigate])

    useEffect(() => {
        const orders = data?.myOrders ?? []
        orders.forEach((order) => {
            socket.emit('joinOrderRoom', order.id)
        })
    }, [data])

    const orders = useMemo(() => data?.myOrders ?? [], [data])

    const stats = useMemo(() => {
        const totalSpent = orders.reduce((sum, o) => sum + o.total, 0)
        const active = orders.filter((o) => o.status === 'PENDING' || o.status === 'PREPARING' || o.status === 'READY')
        return {
            totalOrders: orders.length,
            totalSpent,
            activeCount: active.length,
        }
    }, [orders])

    function OrderProgress({ status }: { status: string }) {
        if (status === 'CANCELLED') {
            return (
                <div className="text-accent text-xs font-medium py-2">This order was cancelled</div>
            )
        }
        const currentIndex = STEPS.indexOf(status)
        return (
            <div className="flex items-center py-2">
                {STEPS.map((step, i) => (
                    <div key={step} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center">
                            <motion.div
                                animate={{
                                    backgroundColor: i <= currentIndex ? 'var(--color-accent)' : 'var(--color-border)',
                                    scale: i === currentIndex ? 1.2 : 1,
                                }}
                                transition={{ duration: 0.3 }}
                                className="w-3 h-3 rounded-full"
                            />
                            <span className={`text-[10px] mt-1 whitespace-nowrap ${i <= currentIndex ? 'text-text' : 'text-text-secondary'}`}>
                                {step.charAt(0) + step.slice(1).toLowerCase()}
                            </span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <motion.div
                                animate={{ backgroundColor: i < currentIndex ? 'var(--color-accent)' : 'var(--color-border)' }}
                                transition={{ duration: 0.3 }}
                                className="h-0.5 flex-1 mx-1 mb-4"
                            />
                        )}
                    </div>
                ))}
            </div>
        )
    }
    function handleReorder(order: Order) {
        order.items.forEach((item) => {
            if (item.menuItem.available) {
                addItem(
                    {
                        menuItemId: item.menuItem.id,
                        name: item.menuItem.name,
                        price: item.menuItem.price,
                        imageUrl: item.menuItem.imageUrl,
                    },
                    item.quantity
                )
            }
        })
        navigate('/cart')
    }

    if (!user) return null
    if (loading) return <div className="p-8 text-text-secondary">Loading orders...</div>
    if (error) return <div className="p-8 text-accent">Failed to load orders: {error.message}</div>

    const withLiveStatus = orders.map((o) => ({ ...o, status: liveStatuses[o.id] || o.status }))
    const filteredOrders = filter === 'ALL' ? withLiveStatus : withLiveStatus.filter((o) => o.status === filter)

    return (
        <div className="min-h-screen bg-bg px-8 py-8">
            <button
                onClick={() => navigate('/')}
                className="text-text-secondary hover:text-text text-sm mb-4 inline-flex items-center gap-1"
            >
                ← Back to menu
            </button>
            <h1 className="font-display text-2xl font-semibold text-text mb-8">Your orders</h1>

            {orders.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mb-8 max-w-xl">
                    {[
                        { label: 'Total orders', value: stats.totalOrders },
                        { label: 'Active orders', value: stats.activeCount },
                        { label: 'Total spent', value: formatPKR(stats.totalSpent) },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-surface border border-border rounded-[10px] p-4"
                        >
                            <p className="text-text-secondary text-xs mb-1">{stat.label}</p>
                            <p className="text-text text-lg font-semibold">{stat.value}</p>
                        </motion.div>
                    ))}
                </div>
            )}

            {orders.length === 0 ? (
                <p className="text-text-secondary">You haven't placed any orders yet.</p>
            ) : (
                <>
                    <div className="flex gap-2 mb-6 overflow-x-auto">
                        {['ALL', ...STATUS_FLOW].map((s) => (
                            <button
                                key={s}
                                onClick={() => setFilter(s)}
                                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap border transition-all ${filter === s
                                    ? 'bg-accent text-white border-accent'
                                    : 'bg-surface text-text-secondary border-border hover:border-accent hover:text-text'
                                    }`}
                            >
                                {s === 'ALL' ? 'All' : s}
                            </button>
                        ))}
                    </div>

                    <div className="max-w-lg space-y-4">
                        <AnimatePresence initial={false}>
                            {filteredOrders.map((order, i) => (
                                <motion.div
                                    key={order.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.25, delay: i * 0.05 }}
                                    className="bg-surface border border-border rounded-[10px] p-4"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-text-secondary text-sm">
                                            {new Date(order.createdAt).toLocaleString()}
                                        </span>
                                        <AnimatePresence mode="wait">
                                            <motion.span
                                                key={order.status}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                transition={{ duration: 0.25 }}
                                                className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusBg[order.status]} ${statusColors[order.status] || 'text-text'}`}
                                            >
                                                {order.status}
                                            </motion.span>
                                        </AnimatePresence>
                                    </div>
                                    <OrderProgress status={order.status} />

                                    <div className="flex gap-2 mb-3 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                        {order.items.map((item, j) => (
                                            <div key={j} className="flex items-center gap-2 bg-bg border border-border rounded-[8px] px-2 py-1.5 whitespace-nowrap">
                                                {item.menuItem.imageUrl ? (
                                                    <div className="w-8 h-8 rounded-[4px] overflow-hidden bg-white border border-border flex-shrink-0">
                                                        <img src={item.menuItem.imageUrl} alt={item.menuItem.name} className="w-full h-full object-cover" />
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-8 rounded-[4px] bg-border flex-shrink-0" />
                                                )}
                                                <span className="text-text text-xs">{item.quantity}× {item.menuItem.name}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <p className="text-accent font-medium">{formatPKR(order.total)}</p>
                                        <motion.button
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => handleReorder(order)}
                                            className="text-sm border border-accent text-accent hover:bg-accent hover:text-white transition-colors px-3 py-1.5 rounded-[6px]"
                                        >
                                            Reorder
                                        </motion.button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {filteredOrders.length === 0 && (
                            <p className="text-text-secondary text-sm">No orders match this filter.</p>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}