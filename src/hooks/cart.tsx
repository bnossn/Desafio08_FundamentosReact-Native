import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      // TODO LOAD ITEMS FROM ASYNC STORAGE
      const productsList = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (productsList) {
        setProducts([...JSON.parse(productsList)]);
      }
    }

    loadProducts();
  }, []);

  const updateAsyncStorage = useCallback(async (productsList: Product[]) => {
    await AsyncStorage.setItem(
      '@GoMarketplace:products',
      JSON.stringify(productsList),
    );

    console.log('AsyncStorage has been updated');
    const asyncContent = await AsyncStorage.getItem(`@GoMarketplace:products`);
    if (asyncContent) console.log(JSON.parse(asyncContent));
  }, []);

  const increment = useCallback(
    async id => {
      const productIndex = products.findIndex(item => item.id === id);

      if (productIndex < 0) {
        throw new Error(`Item not found on cart list`);
      }

      const newProductsList = products;
      newProductsList[productIndex].quantity += 1;

      setProducts([...newProductsList]);

      updateAsyncStorage(newProductsList);
    },
    [products, updateAsyncStorage],
  );

  const decrement = useCallback(
    async id => {
      const productIndex = products.findIndex(item => item.id === id);

      if (productIndex < 0) {
        throw new Error(`Item not found on cart list`);
      }

      const newProductsList = products;
      newProductsList[productIndex].quantity -= 1;

      if (newProductsList[productIndex].quantity <= 0) {
        newProductsList.splice(productIndex, 1);
        setProducts([...newProductsList]);
      } else {
        setProducts([...newProductsList]);
      }

      updateAsyncStorage(newProductsList);
    },
    [products, updateAsyncStorage],
  );

  const addToCart = useCallback(
    async product => {
      const productIndex = products.findIndex(item => item.id === product.id);

      if (productIndex < 0) {
        const newProduct: Product = product;
        newProduct.quantity = 1;
        const newProductsList = [...products, newProduct];
        setProducts([...newProductsList]);
        updateAsyncStorage(newProductsList);
      } else {
        await increment(product.id);
      }
    },
    [increment, products, updateAsyncStorage],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
