import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { ShopItem } from '../components/shop/ShopItemCard';

export function useShop() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShopData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [itemsRes, pointsRes] = await Promise.all([
        api.get('/shop/items'),
        api.get('/shop/points')
      ]);

      if (itemsRes.data.success) {
        setItems(itemsRes.data.items);
      }
      if (pointsRes.data.success) {
        setPoints(pointsRes.data.points);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  const purchaseItem = async (itemId: string) => {
    try {
      const res = await api.post('/shop/purchase', { itemId });
      
      if (res.data.success) {
        // Update local state
        setPoints(res.data.remainingPoints);
        setItems(prev => prev.map(item => 
          item._id === itemId ? { ...item, isOwned: true } : item
        ));
        
        // Dispatch event for other components (like PointsDisplay)
        window.dispatchEvent(new CustomEvent('aether-points-updated', {
          detail: { newTotal: res.data.remainingPoints }
        }));

        return { success: true, item: res.data.item };
      }
      return { success: false, message: res.data.message || 'Purchase failed' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Purchase failed' };
    }
  };

  useEffect(() => {
    fetchShopData();
  }, [fetchShopData]);

  return { items, points, loading, error, purchaseItem, refetch: fetchShopData };
}
