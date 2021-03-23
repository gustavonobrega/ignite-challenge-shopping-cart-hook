import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
     const storagedCart = localStorage.getItem('@RocketShoes:cart')

     if (storagedCart) {
       return JSON.parse(storagedCart);
     }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const cartProduct = cart.find(product => product.id === productId);
     
      const { data: stock } = await api.get<Stock>(`/stock/${productId}`);

      if (!cartProduct) {
        const { data: product } = await api.get<Product>(`/products/${productId}`);

        if (stock.amount > 0) {
          const newCart = {
            ...product,
            amount: 1,
          };

          setCart([...cart, newCart])
          localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, newCart]))
        }
      } else {

          if (stock.amount > cartProduct.amount) {
            const updatedCart = cart.map(product => product.id === productId ? {
              ...product,
              amount: product.amount + 1,
            }: product);

            setCart(updatedCart);
            localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
          } else {
            toast.error('Quantidade solicitada fora de estoque');
            return;
        }
      }       
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const cartProduct = cart.find(product => product.id === productId);
        
      if (cartProduct) {
        const newCart = cart.filter(cartItem => cartItem.id !== productId);
        setCart(newCart)

        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
     } else {
       throw new Error('Produto não existe')
     }

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
            
      if (amount <= 0 ) return;
      
      const { data: stock } = await api.get<Stock>(`/stock/${productId}`);

      if (amount <= stock.amount) {
        const updateCartAmount = cart.map(itemCart => itemCart.id === productId ? {
          ...itemCart,
          amount
        } : itemCart);

        setCart(updateCartAmount);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCartAmount))
      } else {
        toast.error('Quantidade solicitada fora de estoque');  
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
      return;
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
