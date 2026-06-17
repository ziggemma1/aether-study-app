import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { ShopItem } from '../components/shop/ShopItemCard';
import { useAppContext } from '../context/AppContext';

export function useShop() {
  const { user, setUser } = useAppContext();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [points, setPoints] = useState(user?.points || 0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
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
        setTotalEarned(pointsRes.data.totalEarned);
        setTotalSpent(pointsRes.data.totalSpent);
        
        // Sync global user state
        if (user) {
          setUser({ 
            ...user, 
            points: pointsRes.data.points,
            aetherPoints: pointsRes.data.points // Keeping in sync
          });
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [user, setUser]);

  const purchaseItem = async (itemId: string) => {
    try {
      const res = await api.post('/shop/purchase', { itemId });
      
      if (res.data.success) {
        const newTotal = res.data.remainingPoints;
        // Update local state
        setPoints(newTotal);
        setItems(prev => prev.map(item => 
          item._id === itemId ? { ...item, isOwned: true } : item
        ));
        
        // Update global state
        if (user) {
          setUser({
            ...user,
            points: newTotal,
            aetherPoints: newTotal
          });
        }
        
        // Dispatch event for other components (like PointsDisplay)
        window.dispatchEvent(new CustomEvent('aether-points-updated', {
          detail: { newTotal: newTotal }
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

  return { items, points, totalEarned, totalSpent, loading, error, purchaseItem, refetch: fetchShopData };
}
