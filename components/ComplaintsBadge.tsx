import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useRouter } from 'next/router';

interface ComplaintsBadgeProps {
  showForIT?: boolean; // إذا كان true، يعرض الشكاوى غير المعينة
  className?: string;
}

/**
 * Component to show complaints notification badge
 * Can be used in navigation bar or anywhere
 */
export default function ComplaintsBadge({ showForIT = false, className = '' }: ComplaintsBadgeProps) {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComplaintsCount();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchComplaintsCount, 30000);
    
    return () => clearInterval(interval);
  }, [showForIT]);

  const fetchComplaintsCount = async () => {
    try {
      const res = await fetch('/api/complaints/stats');
      const data = await res.json();
      
      if (data.success) {
        if (showForIT) {
          // For IT users: show unassigned + urgent complaints
          setCount((data.stats.it?.unassigned || 0) + (data.stats.it?.urgent || 0));
        } else {
          // For regular users: show their pending complaints
          setCount(data.stats.user?.pending || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching complaints count:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    if (showForIT) {
      router.push('/admin/complaints');
    } else {
      router.push('/admin/personal_page');
    }
  };

  if (loading) {
    return null;
  }

  if (count === 0) {
    return null;
  }

  return (
    <button
      onClick={handleClick}
      className={`relative inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
        showForIT 
          ? 'bg-red-100 text-red-800 hover:bg-red-200' 
          : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
      } ${className}`}
      title={showForIT ? 'شكاوى تحتاج معالجة' : 'شكاوى قيد الانتظار'}
    >
      <AlertCircle size={18} />
      <span className="text-sm font-medium">
        {showForIT ? 'شكاوى عاجلة' : 'شكاواي'}
      </span>
      <span className={`absolute -top-1 -right-1 flex items-center justify-center w-6 h-6 text-xs font-bold text-white rounded-full ${
        showForIT ? 'bg-red-600' : 'bg-yellow-600'
      }`}>
        {count > 99 ? '99+' : count}
      </span>
    </button>
  );
}

