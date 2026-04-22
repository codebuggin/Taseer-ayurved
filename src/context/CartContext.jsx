import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth(); // Assume it doesn't crash if AuthContext is above it, which we fixed

  // Load cart on mount or user change
  useEffect(() => {
    async function initCart() {
      setIsLoading(true);
      const localCart = JSON.parse(localStorage.getItem('taseer_cart') || '[]');

      if (user) {
        // Logged in: Merge local cart into DB if any, then fetch DB cart
        if (localCart.length > 0) {
          for (const item of localCart) {
            // Upsert: Because we have unique(user_id, product_id), we can use conflict resolution
            // Actually, Supabase JS upsert needs primary key. We can just select and update, or insert on conflict
            const { data: existing } = await supabase
              .from('cart_items')
              .select('id, quantity')
              .eq('user_id', user.id)
              .eq('product_id', item.id)
              .single();

            if (existing) {
              await supabase.from('cart_items').update({ quantity: existing.quantity + item.quantity }).eq('id', existing.id);
            } else {
              await supabase.from('cart_items').insert({ user_id: user.id, product_id: item.id, quantity: item.quantity });
            }
          }
          // Clear local storage after merging
          localStorage.removeItem('taseer_cart');
        }

        // Fetch DB cart
        const { data: dbCart, error } = await supabase
          .from('cart_items')
          .select(`
            quantity,
            products ( id, name, price, original_price, image_url, category )
          `)
          .eq('user_id', user.id);

        if (!error && dbCart) {
          const formattedCart = dbCart.map(row => ({
            id: row.products.id,
            name: row.products.name,
            price: row.products.price,
            oldPrice: row.products.original_price,
            image_url: row.products.image_url,
            category: row.products.category,
            quantity: row.quantity
          }));
          setCartItems(formattedCart);
        }
      } else {
        // Guest: load from local storage
        setCartItems(localCart);
      }
      setIsLoading(false);
    }

    initCart();
  }, [user]);

  // Helper to persist guest cart
  const saveLocalCart = (items) => {
    if (!user) {
      localStorage.setItem('taseer_cart', JSON.stringify(items));
    }
  };

  const addToCart = async (product) => {
    setIsCartOpen(true);
    let newItems = [...cartItems];
    const existingIndex = newItems.findIndex(item => item.id === product.id);

    if (existingIndex >= 0) {
      newItems[existingIndex].quantity += 1;
    } else {
      // Map the product to the standard cart format if it's coming from DB
      newItems.push({ 
        id: product.id, 
        name: product.name, 
        price: product.price, 
        oldPrice: product.original_price || product.oldPrice,
        image_url: product.image_url || product.imgColor, // fallback for hardcoded items
        category: product.category,
        quantity: 1 
      });
    }

    setCartItems(newItems);
    saveLocalCart(newItems);

    if (user) {
      const { data: existing } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', user.id)
        .eq('product_id', product.id)
        .single();
      
      if (existing) {
        await supabase.from('cart_items').update({ quantity: existing.quantity + 1 }).eq('id', existing.id);
      } else {
        await supabase.from('cart_items').insert({ user_id: user.id, product_id: product.id, quantity: 1 });
      }
    }
  };

  const removeFromCart = async (id) => {
    const newItems = cartItems.filter(item => item.id !== id);
    setCartItems(newItems);
    saveLocalCart(newItems);

    if (user) {
      await supabase.from('cart_items').delete().eq('user_id', user.id).eq('product_id', id);
    }
  };

  const updateQuantity = async (id, quantity) => {
    if (quantity < 1) return;
    const newItems = cartItems.map(item => item.id === id ? { ...item, quantity } : item);
    setCartItems(newItems);
    saveLocalCart(newItems);

    if (user) {
      await supabase.from('cart_items').update({ quantity }).eq('user_id', user.id).eq('product_id', id);
    }
  };

  const clearCart = async () => {
    setCartItems([]);
    localStorage.removeItem('taseer_cart');
    if (user) {
      await supabase.from('cart_items').delete().eq('user_id', user.id);
    }
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        openCart,
        closeCart,
        cartCount,
        isLoading
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
