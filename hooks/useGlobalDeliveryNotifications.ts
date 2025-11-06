import { useEffect, useState } from 'react';
import { useToast } from '../components/GlobalToast';

interface Delivery {
  id: number;
  deliveryDate: string | null;
  deliveryTime: string | null;
  isDelivered: boolean;
  neworder?: {
    id: number;
    ClientName?: string;
    Name?: string;
    HomemaidId?: number;
  };
}

export function useGlobalDeliveryNotifications() {
  const [clientDeliveries, setClientDeliveries] = useState<Delivery[]>([]);
  const [isLoadingDeliveries, setIsLoadingDeliveries] = useState(true);
  const { showToast } = useToast();

  // Fetch deliveries
  useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        setIsLoadingDeliveries(true);
        const response = await fetch('/api/deliveries');
        
        if (response.ok) {
          const deliveriesData = await response.json();
          setClientDeliveries(deliveriesData);
        } else {
          console.error('Failed to fetch deliveries:', response.status);
          setClientDeliveries([]);
        }
      } catch (error) {
        console.error('Error fetching deliveries:', error);
        setClientDeliveries([]);
      } finally {
        setIsLoadingDeliveries(false);
      }
    };
    
    fetchDeliveries();
    
    // Refresh deliveries every 5 minutes
    const intervalId = setInterval(fetchDeliveries, 30 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notifications.mp3');
      audio.play().catch(e => {
        console.error('Could not play notification.mp3, using beep sound:', e);
        // Fallback: Create a simple beep sound using Web Audio API
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = 800; // Frequency in Hz
          gainNode.gain.value = 0.5; // Volume
          
          oscillator.start();
          setTimeout(() => oscillator.stop(), 300); // Play for 300ms
          
          console.log('🔊 Playing beep sound for delivery notification');
        } catch (audioError) {
          console.log('Could not create beep sound:', audioError);
        }
      });
    } catch (e) {
      console.log('Audio not supported:', e);
    }
  };

  // Check deliveries and play sound
  useEffect(() => {
    // Request notification permission
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Function to check upcoming deliveries and send notifications
    const checkDeliveries = () => {
      if (!clientDeliveries || clientDeliveries.length === 0) {
        return;
      }

      // Check if muted
      const muteExpiry = localStorage.getItem('deliveryNotificationMuteExpiry');
      if (muteExpiry) {
        const expiryTime = parseInt(muteExpiry);
        if (Date.now() < expiryTime) {
          return; // Muted
        } else {
          // Expired, remove from localStorage
          localStorage.removeItem('deliveryNotificationMuteExpiry');
        }
      }

      const now = new Date();
      const twoHoursInMs = 2 * 60 * 60 * 1000;

      clientDeliveries.forEach((delivery) => {
        if (!delivery.deliveryDate || !delivery.deliveryTime || delivery.isDelivered) {
          return;
        }

        try {
          // Parse delivery date and time
          const deliveryDate = new Date(delivery.deliveryDate);
          
          // Parse time (assuming format like "14:30" or "2:30 PM")
          const timeString = delivery.deliveryTime;
          let hours = 0;
          let minutes = 0;
          
          // Try to parse time
          if (timeString.includes(':')) {
            const timeParts = timeString.split(':');
            hours = parseInt(timeParts[0]);
            minutes = parseInt(timeParts[1]);
            
            // Handle PM times if present
            if (timeString.toLowerCase().includes('pm') && hours < 12) {
              hours += 12;
            }
          }
          
          // Set the delivery time
          deliveryDate.setHours(hours, minutes, 0, 0);
          
          // Check if delivery is within 2 hours
          const timeDiff = deliveryDate.getTime() - now.getTime();
          
          // Send notification if delivery is within 2 hours and in the future
          if (timeDiff > 0 && timeDiff <= twoHoursInMs) {
            const clientName = delivery.neworder?.ClientName || delivery.neworder?.Name || 'غير محدد';
            const minutesLeft = Math.floor(timeDiff / (60 * 1000));
            
            // Check last notification time (every 5 minutes)
            const notificationKey = `delivery-last-notified-${delivery.id}`;
            const lastNotified = localStorage.getItem(notificationKey);
            const fiveMinutesInMs = 30 * 60 * 1000;
            
            // Send notification if never notified OR if 5 minutes passed since last notification
            const shouldNotify = !lastNotified || (Date.now() - parseInt(lastNotified)) >= fiveMinutesInMs;
            
            if (shouldNotify) {
              // Play notification sound ALWAYS (independent of browser notification permission)
              playNotificationSound();
              
              // Get worker number from delivery
              const workerNumber = delivery.neworder?.HomemaidId || delivery.id;
              
              // Show Toast notification
              showToast(`🚚 اقترب تسليم عاملة رقم ${workerNumber}`, 'info');
              
              // Show browser notification (if permission granted)
              if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                const notification = new Notification('🚚 تذكير بموعد تسليم قريب', {
                  body: `موعد التسليم للعميل ${clientName} خلال ${minutesLeft} دقيقة\nالموعد: ${timeString}`,
                  icon: '/favicon.ico',
                  badge: '/favicon.ico',
                  tag: `delivery-${delivery.id}`,
                  requireInteraction: true,
                });
                
                notification.onclick = () => {
                  window.focus();
                  notification.close();
                };
              }
              
              // Update last notification time
              localStorage.setItem(notificationKey, Date.now().toString());
            }
          } else if (timeDiff <= 0) {
            // Clear notification history if delivery passed
            const notificationKey = `delivery-last-notified-${delivery.id}`;
            localStorage.removeItem(notificationKey);
          } else if (timeDiff > twoHoursInMs) {
            // Clear notification history if delivery is not within 2 hours anymore
            const notificationKey = `delivery-last-notified-${delivery.id}`;
            localStorage.removeItem(notificationKey);
          }
        } catch (error) {
          console.error('Error checking delivery notification:', error);
        }
      });
    };

    // Check deliveries immediately
    checkDeliveries();

    // Set up interval to check every minute (to send notification every 5 minutes when needed)
    const intervalId = setInterval(checkDeliveries, 60 * 1000);

    // Cleanup
    return () => clearInterval(intervalId);
  }, [clientDeliveries]);
}

