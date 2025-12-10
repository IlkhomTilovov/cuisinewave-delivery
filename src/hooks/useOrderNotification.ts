import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useOrderNotification = (soundEnabled: boolean) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastOrderIdRef = useRef<string | null>(null);

  // Create notification sound using Web Audio API
  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;

    try {
      // Create or resume audio context
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      
      const ctx = audioContextRef.current;
      
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Create a pleasant notification sound (3-tone chime)
      const playTone = (frequency: number, startTime: number, duration: number) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        // Envelope for smooth sound
        gainNode.gain.setValueAtTime(0, ctx.currentTime + startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + duration);
        
        oscillator.start(ctx.currentTime + startTime);
        oscillator.stop(ctx.currentTime + startTime + duration);
      };

      // Play a pleasant 3-tone ascending chime
      playTone(523.25, 0, 0.2);     // C5
      playTone(659.25, 0.15, 0.2);  // E5
      playTone(783.99, 0.3, 0.3);   // G5

    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }, [soundEnabled]);

  useEffect(() => {
    // Subscribe to new orders
    const channel = supabase
      .channel('new-orders-notification')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('New order received:', payload);
          
          // Prevent duplicate notifications
          if (lastOrderIdRef.current === payload.new.id) return;
          lastOrderIdRef.current = payload.new.id;
          
          // Play notification sound
          playNotificationSound();
          
          // Show toast notification
          const order = payload.new as { user_fullname: string; total_price: number };
          toast.success(
            `Yangi buyurtma: ${order.user_fullname}`,
            {
              description: `Summa: ${new Intl.NumberFormat('uz-UZ').format(order.total_price)} so'm`,
              duration: 5000,
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [playNotificationSound]);

  return { playNotificationSound };
};
