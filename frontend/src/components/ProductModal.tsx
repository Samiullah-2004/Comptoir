import { motion } from 'framer-motion'
import { useState } from 'react'
import Counter from './Counter'

interface MenuItem {
    id: string
    name: string
    price: number
    imageUrl: string | null
    available: boolean
}

interface Props {
    item: MenuItem
    onClose: () => void
    onAdd: (item: MenuItem, quantity: number) => void
}

function formatPKR(amount: number) {
    return `Rs. ${amount.toLocaleString('en-PK')}`
}

export default function ProductModal({ item, onClose, onAdd }: Props) {
    const [quantity, setQuantity] = useState(1)

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                layoutId={`card-${item.id}`}
                layout
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="bg-surface rounded-[16px] overflow-hidden max-w-md w-full"
                onClick={onClose}
            >
                <motion.div layoutId={`image-${item.id}`} className="w-full aspect-square">
                    {item.imageUrl && (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    )}
                </motion.div>
                <div className="p-6">
                    <motion.h2
                        layoutId={`title-${item.id}`}
                        className="font-display text-2xl text-text mb-2"
                    >
                        {item.name}
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.15 }}
                        className="text-text-secondary mb-5"
                    >
                        Freshly prepared with quality ingredients, made to order.
                    </motion.p>
                    <div className="flex items-center justify-between mb-4">
                        <motion.span
                            layoutId={`price-${item.id}`}
                            className="text-accent text-xl font-semibold"
                        >
                            {formatPKR(item.price)}
                        </motion.span>
                        <Counter value={quantity} onChange={setQuantity} />
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={!item.available}
                        onClick={(e) => {
                            e.stopPropagation()
                            onAdd(item, quantity)
                            setQuantity(1)
                        }}
                        className="w-full bg-accent hover:bg-accent-hover disabled:opacity-40 text-white px-5 py-2.5 rounded-[6px]"
                    >
                        Add to cart
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    )
}