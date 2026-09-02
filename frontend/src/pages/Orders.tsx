import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@apollo/client/react'
import { useNavigate } from 'react-router-dom'
import { GET_MY_ORDERS } from '../graphql/queries'
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
    items: OrderItem[]
}

function formatPKR(amount: number) {
    return `Rs. ${amount.toLocaleString('en-PK')}`
}

const statusColors: Record<string, string> = {
    PENDING: 'text-text-secondary',
    PREPARING: 'text-accent',
    READY: 'text-success',
    COMPLETED: 'text-success',
    CANCELLED: 'text-accent',
}

export default function Orders() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const { data, loading, error } = useQuery<{ myOrders: Order[] }>(GET_MY_ORDERS, {
        skip: !user,
    })
    const [liveStatuses, setLiveStatuses] = useState<Record<string, string>>({})

    useEffect(() => {
        if (!user) {
            navigate('/login')
            return
        }

        socket.connect()

        function handleUpdate(payload: { orderId: string; status: string }) {
            console.log('status update received, new status:', payload.status)
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

    if (!user) return null
    if (loading) return <div className="p-8 text-text-secondary">Loading orders...</div>
    if (error) return <div className="p-8 text-accent">Failed to load orders: {error.message}</div>

    const orders = data?.myOrders ?? []

    return (
        <div className="min-h-screen bg-bg px-8 py-8">
            <h1 className="font-display text-2xl font-semibold text-text mb-6">Your orders</h1>

            {orders.length === 0 && (
                <p className="text-text-secondary">You haven't placed any orders yet.</p>
            )}

            <div className="max-w-lg space-y-4">
                {orders.map((order, i) => {
                    const status = liveStatuses[order.id] || order.status
                    return (
                        <motion.div
                            key={order.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, delay: i * 0.05 }}
                            className="bg-surface border border-border rounded-[10px] p-4"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-text-secondary text-sm">
                                    {new Date(order.createdAt).toLocaleString()}
                                </span>
                                <AnimatePresence mode="wait">
                                    <motion.span
                                        key={status}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        transition={{ duration: 0.25 }}
                                        className={`text-sm font-medium ${statusColors[status] || 'text-text'}`}
                                    >
                                        {status}
                                    </motion.span>
                                </AnimatePresence>
                            </div>
                            <ul className="text-text text-sm mb-2">
                                {order.items.map((item, i) => (
                                    <li key={i}>{item.quantity} × {item.menuItem.name}</li>
                                ))}
                            </ul>
                            <p className="text-accent font-medium">{formatPKR(order.total)}</p>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}