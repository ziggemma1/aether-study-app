import { useCallback } from 'react';
import api from '../services/api';

export function usePointsEarning() {
  const awardPoints = useCallback(async (action: string, referenceId?: string) => {
    try {
      // In a real app, you might have a dedicated endpoint for certain events
      // OR this hook just triggers the common logic
      const res = await api.post('/users/award-points', { action, referenceId });
      
      if (res.data.success) {
        // Trigger points display update
        window.dispatchEvent(new CustomEvent('aether-points-updated', { 
          detail: { newTotal: res.data.newTotal } 
        }));
        return res.data;
      }
    } catch (error) {
      console.error('Failed to award points:', error);
    }
  }, []);

  return { awardPoints };
}
