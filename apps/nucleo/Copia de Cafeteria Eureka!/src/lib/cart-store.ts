import { create } from 'zustand'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
  productId: string
}

interface CartStore {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  
  addItem: (item) => {
    const items = get().items
    const existingItem = items.find(i => i.productId === item.productId)
    
    if (existingItem) {
      set({
        items: items.map(i =>
          i.productId === item.productId
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        )
      })
    } else {
      set({
        items: [...items, { ...item, id: Date.now().toString() }]
      })
    }
  },
  
  removeItem: (itemId) => {
    set({
      items: get().items.filter(item => item.id !== itemId)
    })
  },
  
  updateQuantity: (itemId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(itemId)
      return
    }
    
    set({
      items: get().items.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    })
  },
  
  clearCart: () => set({ items: [] }),
  
  getTotalItems: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0)
  },
  
  getTotalPrice: () => {
    return get().items.reduce((total, item) => total + (item.price * item.quantity), 0)
  }
}))