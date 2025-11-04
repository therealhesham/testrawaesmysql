import Head from 'next/head';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Chart, LineController, BarController, DoughnutController, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import 'tailwindcss/tailwind.css';
import Layout from 'example/containers/Layout';
import { format } from 'date-fns';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// Dynamically import Highcharts components (SSR-safe)
const HighchartsReact = dynamic(() => import('highcharts-react-official'), { ssr: false });

declare global {
  interface Window {
    Highcharts: any;
  }
}

// Register Chart.js components
Chart.register(LineController, BarController, DoughnutController, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend);

// Plugin مخصص لضمان وضوح الأعمدة الصغيرة في رسوم الإشغال
const minBarHeightPlugin = {
  id: 'minBarHeight',
  afterDatasetsDraw: (chart: any) => {
    if (chart.config.type !== 'bar') return;
    const ctx = chart.ctx;
    const meta = chart.getDatasetMeta(0);
    if (!meta || !meta.data || !chart.data?.datasets?.[0]?.data) return;
    
    const minHeight = 5; // حد أدنى للارتفاع بالبكسل
    const dataset = chart.data.datasets[0];
    // استخدام لون العمود من dataset إذا كان متاحاً
    const barColor = dataset.borderColor || dataset.backgroundColor || '#2d7a7a';

    meta.data.forEach((bar: any, index: number) => {
      const value = dataset.data[index];
      if (value != null && value > 0 && typeof value === 'number') {
        const barHeight = Math.abs(bar.height);
        if (barHeight < minHeight) {
          // رسم خط أدنى للعمود الصغير لضمان وضوحه
          ctx.save();
          ctx.strokeStyle = Array.isArray(barColor) ? barColor[0] : barColor;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(bar.x - bar.width / 2, bar.y);
          ctx.lineTo(bar.x + bar.width / 2, bar.y);
          ctx.stroke();
          ctx.restore();
        }
      }
    });
  }
};

Chart.register(minBarHeightPlugin);

// Modal Component
const DataTableModal = ({ isOpen, onClose, title, columns, data }: { isOpen: boolean; onClose: () => void; title: string; columns: string[]; data: any[] }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50">
                  {columns.map((col, i) => (
                    <th key={i} className="border px-4 py-2 text-right font-semibold text-gray-700">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.length > 0 ? (
                  data.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      {columns.map((col, j) => (
                        <td key={j} className="border px-4 py-2 text-gray-800">{row[col] || '-'}</td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} className="text-center py-4 text-gray-500">لا توجد بيانات</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  // Color palette
  const primaryColor = '#2d7a7a';
  const secondaryColor = '#45a5a5';
  const tertiaryColor = '#6fc9c9';
  const lightColor = '#a8e0e0';

  // State for data
  const [reportsData, setReportsData] = useState<any>(null);
  const [inLocationsData, setInLocationsData] = useState<any>(null);
  const [housedWorkerData, setHousedWorkerData] = useState<any>(null);
  const [ordersStatsData, setOrdersStatsData] = useState<any>(null);
  const [growthData, setGrowthData] = useState<any>(null);
  const [governmentalData, setGovernmentalData] = useState<any>(null);
  const [clientsData, setClientsData] = useState<any>(null);
  const [tasksData, setTasksData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  
  // Separate period states for each chart
  const [ordersPeriod, setOrdersPeriod] = useState<string>('year');
  const [ordersStartDate, setOrdersStartDate] = useState<string>('');
  const [ordersEndDate, setOrdersEndDate] = useState<string>('');
  
  const [growthPeriod, setGrowthPeriod] = useState<string>('year');
  const [growthStartDate, setGrowthStartDate] = useState<string>('');
  const [growthEndDate, setGrowthEndDate] = useState<string>('');
  
  const [tasksPeriod, setTasksPeriod] = useState<string>('year');
  const [tasksStartDate, setTasksStartDate] = useState<string>('');
  const [tasksEndDate, setTasksEndDate] = useState<string>('');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalColumns, setModalColumns] = useState<string[]>([]);
  const [modalData, setModalData] = useState<any[]>([]);

  const openModal = (title: string, columns: string[], data: any[]) => {
    setModalTitle(title);
    setModalColumns(columns);
    setModalData(data);
    setModalOpen(true);
  };

  // Fetch data
  const fetchHousedWorkerData = async () => {
    try {
      const response = await fetch('/api/reports/housedworker');
      const data = await response.json();
      setHousedWorkerData(data);
    } catch (error) {
      console.error('Error fetching housed worker data:', error);
    }
  };

  const fetchInLocationsData = async () => {
    try {
      const response = await fetch('/api/reports/inlocations');
      const data = await response.json();
      setInLocationsData(data);
    } catch (error) {
      console.error('Error fetching in locations data:', error);
    }
  };

  const regionMap: { [key: string]: string } = {
    'Ar Riyāḍ': 'sa-ri',
    'Makkah al Mukarramah': 'sa-mk',
    'Al Madīnah al Munawwarah': 'sa-md',
    'Ash Sharqīyah': 'sa-sh',
    'Asīr': 'sa-as',
    'Tabūk': 'sa-tb',
    'Al Ḩudūd ash Shamālīyah': 'sa-hs',
    'Jazan': 'sa-jz',
    'Najrān': 'sa-nj',
    'Al Bāḩah': 'sa-bh',
    'Al Jawf': 'sa-ju',
    'Al Qaşīm': 'sa-qs',
    'Ḩa\'il': 'sa-hl',
  };

  const arabicRegionMap: { [key: string]: string } = {
    'Ar Riyāḍ': 'الرياض',
    'Makkah al Mukarramah': 'مكة المكرمة',
    'Al Madīnah al Munawwarah': 'المدينة المنورة',
    'Ash Sharqīyah': 'المنطقة الشرقية',
    'Asīr': 'عسير',
    'Tabūk': 'تبوك',
    'Al Ḩudūd ash Shamālīyah': 'الحدود الشمالية',
    'Jazan': 'جازان',
    'Najrān': 'نجران',
    'Al Bāḩah': 'الباحة',
    'Al Jawf': 'الجوف',
    'Al Qaşīm': 'القصيم',
    'Ḩa\'il': 'حائل',
  };

  // خريطة عكسية من hc-key إلى الاسم الإنجليزي للمدينة
  const hcKeyToEnglishMap: { [key: string]: string } = {
    'sa-ri': 'Ar Riyāḍ',
    'sa-mk': 'Makkah al Mukarramah',
    'sa-md': 'Al Madīnah al Munawwarah',
    'sa-sh': 'Ash Sharqīyah',
    'sa-as': 'Asīr',
    'sa-tb': 'Tabūk',
    'sa-hs': 'Al Ḩudūd ash Shamālīyah',
    'sa-jz': 'Jazan',
    'sa-nj': 'Najrān',
    'sa-bh': 'Al Bāḩah',
    'sa-ju': 'Al Jawf',
    'sa-qs': 'Al Qaşīm',
    'sa-hl': 'Ḩa\'il',
  };

  useEffect(() => {
    fetchHousedWorkerData();
    fetchInLocationsData();
    const fetchAllData = async () => {
      try {
        setLoading(true);

        // Fetch tasks data with tasksPeriod
        const tasksUrl = tasksPeriod === 'custom'
          ? `/api/reports/tasks`
          : `/api/reports/tasks?period=${tasksPeriod}`;
        
        const tasksResponse = await fetch(tasksUrl, {
          method: tasksPeriod === 'custom' ? 'POST' : 'GET',
          headers: { 'Content-Type': 'application/json' },
          body: tasksPeriod === 'custom' ? JSON.stringify({ period: tasksPeriod, startDate: tasksStartDate, endDate: tasksEndDate }) : undefined,
        });
        const tasks = await tasksResponse.json();
        setTasksData(tasks);

        // Fetch orders stats data with ordersPeriod
        const ordersStatsUrl = ordersPeriod === 'custom'
          ? `/api/reports/orders`
          : `/api/reports/orders?period=${ordersPeriod}`;
        
        const ordersStatsResponse = await fetch(ordersStatsUrl, {
          method: ordersPeriod === 'custom' ? 'POST' : 'GET',
          headers: { 'Content-Type': 'application/json' },
          body: ordersPeriod === 'custom' ? JSON.stringify({ period: ordersPeriod, startDate: ordersStartDate, endDate: ordersEndDate }) : undefined,
        });
        const ordersStats = await ordersStatsResponse.json();
        setOrdersStatsData(ordersStats);

        // Fetch growth data with growthPeriod
        const growthUrl = growthPeriod === 'custom'
          ? `/api/reports/orders`
          : `/api/reports/orders?period=${growthPeriod}`;
        
        const growthResponse = await fetch(growthUrl, {
          method: growthPeriod === 'custom' ? 'POST' : 'GET',
          headers: { 'Content-Type': 'application/json' },
          body: growthPeriod === 'custom' ? JSON.stringify({ period: growthPeriod, startDate: growthStartDate, endDate: growthEndDate }) : undefined,
        });
        const growth = await growthResponse.json();
        setGrowthData(growth);

        const reportsResponse = await fetch('/api/reports');
        const reports = await reportsResponse.json();
        setReportsData(reports);

        const governmentalResponse = await fetch('/api/reports/governmental');
        const governmental = await governmentalResponse.json();
        setGovernmentalData(governmental);

        const clientsResponse = await fetch('/api/report/clients');
        const clients = await clientsResponse.json();
        setClientsData(clients);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [ordersPeriod, ordersStartDate, ordersEndDate, growthPeriod, growthStartDate, growthEndDate, tasksPeriod, tasksStartDate, tasksEndDate]);

  // Map data
  const mapData = reportsData?.citiesSources?.byCity
    ?.map((item: any) => {
      const eng = item.city;
      const hcKey = regionMap[eng as keyof typeof regionMap];
      const name = arabicRegionMap[eng as keyof typeof arabicRegionMap];
      const value = item._count?.id || 0;
      if (!hcKey || !name) {
        console.warn(`Skipping invalid city data: ${eng}`);
        return null;
      }
      return { 'hc-key': hcKey, name, value };
    })
    .filter(Boolean) || [];

  // Load Highcharts map
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initMap = async () => {
      try {
        // تعريف الخرائط داخل useEffect لضمان الوصول إليها
        const hcKeyToEnglishMap: { [key: string]: string } = {
          'sa-ri': 'Ar Riyāḍ',
          'sa-mk': 'Makkah al Mukarramah',
          'sa-md': 'Al Madīnah al Munawwarah',
          'sa-sh': 'Ash Sharqīyah',
          'sa-as': 'Asīr',
          'sa-tb': 'Tabūk',
          'sa-hs': 'Al Ḩudūd ash Shamālīyah',
          'sa-jz': 'Jazan',
          'sa-nj': 'Najrān',
          'sa-bh': 'Al Bāḩah',
          'sa-ju': 'Al Jawf',
          'sa-qs': 'Al Qaşīm',
          'sa-hl': 'Ḩa\'il',
        };

        const arabicRegionMap: { [key: string]: string } = {
          'Ar Riyāḍ': 'الرياض',
          'Makkah al Mukarramah': 'مكة المكرمة',
          'Al Madīnah al Munawwarah': 'المدينة المنورة',
          'Ash Sharqīyah': 'المنطقة الشرقية',
          'Asīr': 'عسير',
          'Tabūk': 'تبوك',
          'Al Ḩudūd ash Shamālīyah': 'الحدود الشمالية',
          'Jazan': 'جازان',
          'Najrān': 'نجران',
          'Al Bāḩah': 'الباحة',
          'Al Jawf': 'الجوف',
          'Al Qaşīm': 'القصيم',
          'Ḩa\'il': 'حائل',
        };

        const loadHighcharts = async () => {
          if (!window.Highcharts) {
            await new Promise<void>((resolve) => {
              const script = document.createElement('script');
              script.src = 'https://code.highcharts.com/maps/highmaps.js';
              script.onload = () => {
                const exportScript = document.createElement('script');
                exportScript.src = 'https://code.highcharts.com/maps/modules/exporting.js';
                exportScript.onload = () => resolve();
                document.head.appendChild(exportScript);
              };
              document.head.appendChild(script);
            });
          }

          if (mapData.length === 0) {
            setMapLoaded(true);
            return;
          }

          const res = await fetch('https://code.highcharts.com/mapdata/countries/sa/sa-all.topo.json');
          const topology = await res.json();

          window.Highcharts.mapChart('map-container', {
            chart: { map: topology },
            title: { text: 'العملاء حسب المدينة' },
            mapNavigation: { enabled: true },
            colorAxis: { min: 0, minColor: '#14B8A6', maxColor: '#134E4A' },
            tooltip: {
              headerFormat: '',
              pointFormatter: function(this: any) {
                const hcKey = this['hc-key'];
                const englishName = hcKeyToEnglishMap[hcKey];
                const arabicName = englishName ? arabicRegionMap[englishName] : (this.name || '');
                const value = this.value !== undefined ? this.value : 0;
                return `<b>${arabicName}</b>: ${value}`;
              },
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              style: { color: '#fff', fontFamily: '"Tajawal", sans-serif', fontSize: '14px', direction: 'rtl' },
            },
            series: [{
              data: mapData,
              joinBy: ['hc-key', 'hc-key'],
              name: 'عدد العملاء',
              nullColor: '#14B8A6',
              borderColor: '#F5FF57',
              borderWidth: 1,
              states: { hover: { color: '#BADA55', borderColor: '#333', borderWidth: 2 } },
              dataLabels: { 
                enabled: true, 
                formatter: function(this: any) {
                  const hcKey = this.point['hc-key'];
                  const englishName = hcKeyToEnglishMap[hcKey];
                  const arabicName = englishName ? arabicRegionMap[englishName] : (this.point.name || '');
                  return arabicName;
                },
                style: { fontFamily: '"Tajawal", sans-serif' } 
              },
            }],
          });
          setMapLoaded(true);
        };

        loadHighcharts();
      } catch (err) {
        console.error('فشل تحميل الخريطة:', err);
        setMapError('خطأ أثناء تحميل الخريطة');
        setMapLoaded(true);
      }
    };

    initMap();
  }, [mapData]);

  // Chart Data
  const inLocationBarChartData = {
    labels: inLocationsData?.map((item: any) => item.location) || [],
    datasets: [{
      label: 'نسبة الإشغال (%)',
      data: inLocationsData?.map((item: any) => item.occupancyPercentage) || [],
      backgroundColor: primaryColor,
      borderColor: primaryColor,
      borderWidth: 1,
    }],
  };

  const inLocationBarChartOptions = {
    responsive: true,
    scales: {
      y: { 
        beginAtZero: true, 
        max: 100, 
        title: { display: true, text: 'نسبة الإشغال (%)', font: { family: '"Tajawal", sans-serif', size: 14 } },
        ticks: {
          stepSize: 1, // إظهار كل نسبة حتى 1%
          precision: 1,
          callback: function(value: any) {
            return value + '%';
          }
        }
      },
      x: { grid: { display: false }, title: { display: true, text: 'الموقع', font: { family: '"Tajawal", sans-serif', size: 14 } } },
    },
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' as const, labels: { font: { family: '"Tajawal", sans-serif', size: 14 } } },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: { family: '"Tajawal", sans-serif' },
        bodyFont: { family: '"Tajawal", sans-serif' },
        callbacks: {
          label: (context: any) => {
            const index = context.dataIndex;
            const item = inLocationsData[index];
            return [
              `نسبة الإشغال: ${item.occupancyPercentage}%`,
              `عدد العاملين: ${item.housedWorkersCount}`,
              `السعة الإجمالية: ${item.quantity}`,
            ];
          },
        },
      },
    },
  };

  const donutChart1Data = {
    labels: ['جديد', 'قيد التنفيذ', 'مكتمل', 'ملغي'],
    datasets: [{
      data: [ordersStatsData?.new_order || 0, ordersStatsData?.in_progress || 0, ordersStatsData?.delivered || 0, ordersStatsData?.cancelled || 0],
      backgroundColor: ["#600000", "#F8DADA", "lightblue", tertiaryColor],
    }],
  };

  const lineChart1Data = {
    labels: growthPeriod === 'year'
      ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
      : (growthData?.timeSeriesData?.labels && Array.isArray(growthData.timeSeriesData.labels))
        ? growthData.timeSeriesData.labels.map((label: string) => {
            try {
              if (!label) return '';
              const date = new Date(label);
              if (isNaN(date.getTime())) {
                return label; // إرجاع القيمة الأصلية إذا كان التاريخ غير صالح
              }
              return format(date, 'd/M');
            } catch (error) {
              console.error('Error formatting date:', label, error);
              return label || '';
            }
          })
        : [],
    datasets: [{
      data: growthData?.timeSeriesData?.data || Array(growthPeriod === 'year' ? 12 : 30).fill(0),
      borderColor: primaryColor,
      backgroundColor: 'rgba(45, 122, 122, 0.1)',
      tension: 0.4,
      fill: true,
    }],
  };

  const donutChart4Data = {
    labels: ordersStatsData?.SourcesStats
      ?.filter((item: any) => item.Source != null && item.Source !== undefined && item.Source !== '')
      ?.map((item: any) => item.Source || 'غير محدد') || ['تويتر', 'فيسبوك', 'أخرى'],
    datasets: [{
      data: ordersStatsData?.SourcesStats
        ?.filter((item: any) => item.Source != null && item.Source !== undefined && item.Source !== '')
        ?.map((item: any) => item._count?.id || 0) || [0, 0, 0],
      backgroundColor: [primaryColor, secondaryColor, tertiaryColor, lightColor],
      borderColor: [primaryColor, secondaryColor, tertiaryColor, lightColor],
      borderWidth: 1,
    }],
  };

  const barChart2Data = {
    labels: tasksData?.timeSeriesData?.labels?.length > 0
      ? tasksData.timeSeriesData.labels
      : ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    datasets: [
      {
        label: 'المهام المكتملة',
        data: tasksData?.timeSeriesData?.completedData?.length > 0 ? tasksData.timeSeriesData.completedData : Array(12).fill(0),
        backgroundColor: primaryColor,
        borderColor: primaryColor,
        borderWidth: 1,
      },
      {
        label: 'المهام غير المكتملة',
        data: tasksData?.timeSeriesData?.incompleteData?.length > 0 ? tasksData.timeSeriesData.incompleteData : Array(12).fill(0),
        backgroundColor: secondaryColor,
        borderColor: secondaryColor,
        borderWidth: 1,
      },
    ],
  };

  const barChart2Options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' as const, labels: { font: { family: '"Tajawal", sans-serif', size: 14 } } },
      tooltip: { enabled: true, backgroundColor: 'rgba(0, 0, 0, 0.8)', titleFont: { family: '"Tajawal", sans-serif' }, bodyFont: { family: '"Tajawal", sans-serif' } },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'عدد المهام', font: { family: '"Tajawal", sans-serif', size: 14 } } },
      x: { grid: { display: false }, title: { display: true, text: 'الأشهر', font: { family: '"Tajawal", sans-serif', size: 14 } } },
    },
  };

  const donutChartTasksPriorityData = {
    labels: tasksData?.priorityStats?.map((item: any) => item.priority || 'غير محدد') || ['غير محدد'],
    datasets: [{
      data: tasksData?.priorityStats?.map((item: any) => item.count) || [0],
      backgroundColor: [primaryColor, secondaryColor, tertiaryColor, lightColor],
    }],
  };

  const donutChart2Data = {
    labels: ['لديهم مستحقات', 'بدون مستحقات'],
    datasets: [{
      data: [reportsData?.clientsReceivables?.withReceivables || 0, reportsData?.clientsReceivables?.withoutReceivables || 0],
      backgroundColor: [primaryColor, secondaryColor],
    }],
  };

  const barChart3Data = {
    labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    datasets: [{
      data: growthData?.timeSeriesData?.data || Array(12).fill(0),
      backgroundColor: primaryColor,
    }],
  };

  const reasons = ['نقل كفالة', 'مشكلة مكتب العمل', 'انتظار الترحيل', 'رفض العامل لنقل الكفالة', 'هروب العاملة', 'رفض العامل للسفر'];

  const miniDonutData = reasons.map((reason) => {
    const reasonData = housedWorkerData?.nationalityStats?.[reason] || {};
    const total = housedWorkerData?.total || 1;
    const nationalities = Object.keys(reasonData);
    const colors = [primaryColor, secondaryColor, tertiaryColor, lightColor, '#ff6b6b', '#4ecdc4', '#95e1d3', '#f38181', '#a8e6cf', '#ffd3a5'];
    
    // جمع جميع الجنسيات في dataset واحد لدائرة واحدة
    const nationalityData = nationalities.map((country) => reasonData[country]?.count || 0);
    const nationalityLabels = nationalities;
    const nationalityColors = nationalities.map((_, i) => colors[i % colors.length]);
    
    return {
      reason,
      chartData: {
        labels: nationalityLabels,
        datasets: [{
          data: nationalityData,
          backgroundColor: nationalityColors,
          borderColor: '#ffffff',
          borderWidth: 2,
        }],
      },
      data: nationalities.map((country) => ({
        country,
        count: reasonData[country]?.count || 0,
        percentage: reasonData[country]?.percentage || 0,
      })),
    };
  });

  const lineChart2Data = {
    labels: Array.from({ length: 12 }, (_, i) => `الشهر ${i + 1}`),
    datasets: [{
      data: growthData?.timeSeriesData?.data || Array(12).fill(0),
      borderColor: primaryColor,
      backgroundColor: 'rgba(45, 122, 122, 0.1)',
      tension: 0.4,
      fill: true,
    }],
  };

  const teamData = [85, 92, 78, 88, 95, 82];
  const barChart4Data = {
    labels: ['الفريق 1', 'الفريق 2', 'الفريق 3', 'الفريق 4', 'الفريق 5', 'الفريق 6'],
    datasets: [{
      data: teamData.map((v) => v + Math.random() * 10 - 5),
      backgroundColor: primaryColor,
    }],
  };

  const barChart5Data = {
    labels: ['الفريق 1', 'الفريق 2', 'الفريق 3', 'الفريق 4', 'الفريق 5', 'الفريق 6'],
    datasets: [{
      data: teamData.map((v) => v + Math.random() * 10 - 5),
      backgroundColor: primaryColor,
    }],
  };

  const groupedBarData = Array.from({ length: 3 }, () => ({
    labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    datasets: [
      { label: '2023', data: Array.from({ length: 12 }, () => Math.floor(Math.random() * 50) + 30), backgroundColor: primaryColor },
      { label: '2024', data: growthData?.timeSeriesData?.data || Array(12).fill(0), backgroundColor: secondaryColor },
      { label: '2025', data: Array.from({ length: 12 }, () => Math.floor(Math.random() * 50) + 50), backgroundColor: tertiaryColor },
    ],
  }));

  const lineChart34Data = Array.from({ length: 2 }, () => ({
    labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    datasets: [
      { label: 'الفعلي', data: growthData?.timeSeriesData?.data || Array(12).fill(0), borderColor: primaryColor, tension: 0.4 },
      { label: 'المتوقع', data: Array.from({ length: 12 }, () => Math.floor(Math.random() * 40) + 70), borderColor: secondaryColor, borderDash: [5, 5], tension: 0.4 },
    ],
  }));

  const barChart6Data = {
    labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس'],
    datasets: [{
      data: growthData?.timeSeriesData?.data?.slice(0, 8) || [0, 0, 0, 0, 0, 0, 0, 0],
      backgroundColor: primaryColor,
    }],
  };

  const donutChart3Data = {
    labels: ['مكتمل', 'غير مكتمل'],
    datasets: [{
      data: [tasksData?.completed || 0, tasksData?.incomplete || 0],
      backgroundColor: [primaryColor, lightColor],
    }],
  };

  const barChart7Data = {
    labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    datasets: [{
      data: growthData?.timeSeriesData?.data || Array(12).fill(0),
      backgroundColor: primaryColor,
    }],
  };

  // Chart options
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true }, x: { grid: { display: false } } },
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'left' as const } },
  };

  const miniDonutOptions = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: '70%',
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
  };

  const groupedBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' as const } },
    scales: { y: { beginAtZero: true } },
  };

  const lineChart34Options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' as const } },
    scales: { y: { beginAtZero: true } },
  };

  const donutChart3Options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: { legend: { position: 'bottom' as const } },
  };

  // Table data for modals
  const ordersTableData = [
    { الحالة: 'جديد', العدد: ordersStatsData?.new_order || 0 },
    { الحالة: 'قيد التنفيذ', العدد: ordersStatsData?.in_progress || 0 },
    { الحالة: 'مكتمل', العدد: ordersStatsData?.delivered || 0 },
    { الحالة: 'ملغي', العدد: ordersStatsData?.cancelled || 0 },
  ];

  const growthRateTableData = lineChart1Data.labels.map((label: string, i: number) => ({
    الفترة: label,
    العدد: lineChart1Data.datasets[0].data[i] || 0,
  }));

  const citiesTableData = mapData.map((item: any) => ({
    المدينة: item.name,
    العدد: item.value,
  }));

  const sourcesTableData = ordersStatsData?.SourcesStats
    ?.filter((item: any) => item.Source != null && item.Source !== undefined && item.Source !== '')
    ?.map((item: any) => ({
      المصدر: item.Source || 'غير محدد',
      العدد: item._count?.id || 0,
    })) || [];

  const receivablesTableData = [
    { الحالة: 'لديهم مستحقات', العدد: reportsData?.clientsReceivables?.withReceivables || 0 },
    { الحالة: 'بدون مستحقات', العدد: reportsData?.clientsReceivables?.withoutReceivables || 0 },
  ];

  const tasksTableData = barChart2Data.labels.map((label: string, i: number) => ({
    الشهر: label,
    'المهام المكتملة': barChart2Data.datasets[0].data[i] || 0,
    'المهام غير المكتملة': barChart2Data.datasets[1].data[i] || 0,
  }));

  const tasksPriorityTableData = tasksData?.priorityStats?.map((item: any) => ({
    الأولوية: item.priority || 'غير محدد',
    العدد: item.count || 0,
  })) || [];

  const monthlyOrdersTableData = barChart3Data.labels.map((label: string, i: number) => ({
    الشهر: label,
    العدد: barChart3Data.datasets[0].data[i] || 0,
  }));

  const housedWorkersTableData = reasons.flatMap((reason) =>
    miniDonutData
      .find((d) => d.reason === reason)
      ?.data.map((d) => ({
        السبب: reason,
        الجنسية: d.country,
        العدد: d.count,
        النسبة: `${d.percentage}%`,
      })) || []
  );

  const inLocationsTableData = inLocationsData?.map((item: any) => ({
    الموقع: item.location,
    'السعة الإجمالية': item.quantity,
    'عدد العاملين': item.housedWorkersCount,
    'نسبة الإشغال': `${item.occupancyPercentage}%`,
  })) || [];

  const trendsTableData = lineChart2Data.labels.map((label: string, i: number) => ({
    الشهر: label,
    العدد: lineChart2Data.datasets[0].data[i] || 0,
  }));

  const teamPerformance1TableData = barChart4Data.labels.map((label: string, i: number) => ({
    الفريق: label,
    الأداء: barChart4Data.datasets[0].data[i].toFixed(1),
  }));

  const teamPerformance2TableData = barChart5Data.labels.map((label: string, i: number) => ({
    الفريق: label,
    الأداء: barChart5Data.datasets[0].data[i].toFixed(1),
  }));

  const groupedBarTableData = groupedBarData.map((group, groupIndex) =>
    group.labels.map((label: string, i: number) => ({
      الشهر: label,
      '2023': group.datasets[0].data[i],
      '2024': group.datasets[1].data[i],
      '2025': group.datasets[2].data[i],
      المجموعة: `المجموعة ${groupIndex + 1}`,
    }))
  ).flat();

  const forecastTableData1 = lineChart34Data[0].labels.map((label: string, i: number) => ({
    الشهر: label,
    الفعلي: lineChart34Data[0].datasets[0].data[i],
    المتوقع: lineChart34Data[0].datasets[1].data[i],
  }));

  const forecastTableData2 = lineChart34Data[1].labels.map((label: string, i: number) => ({
    الشهر: label,
    الفعلي: lineChart34Data[1].datasets[0].data[i],
    المتوقع: lineChart34Data[1].datasets[1].data[i],
  }));

  const performanceOverviewTableData = barChart6Data.labels.map((label: string, i: number) => ({
    الشهر: label,
    العدد: barChart6Data.datasets[0].data[i],
  }));

  const taskCompletionTableData = [
    { الحالة: 'مكتمل', العدد: tasksData?.completed || 0 },
    { الحالة: 'غير مكتمل', العدد: tasksData?.incomplete || 0 },
  ];

  const finalReportTableData = barChart7Data.labels.map((label: string, i: number) => ({
    الشهر: label,
    العدد: barChart7Data.datasets[0].data[i],
  }));

  // Skeleton component
  const ChartSkeleton = () => (
    <SkeletonTheme baseColor="#e5e7eb" highlightColor="#f3f4f6">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
          <Skeleton width={80} height={20} />
          <Skeleton width={150} height={20} />
        </div>
        <Skeleton height={256} />
      </div>
    </SkeletonTheme>
  );

  const MapSkeleton = () => (
    <SkeletonTheme baseColor="#e5e7eb" highlightColor="#f3f4f6">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
          <Skeleton width={80} height={20} />
          <Skeleton width={150} height={20} />
        </div>
        <Skeleton height={400} />
      </div>
    </SkeletonTheme>
  );

  const KPISkeleton = () => (
    <SkeletonTheme baseColor="#e5e7eb" highlightColor="#f3f4f6">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
          <Skeleton width={80} height={20} />
          <Skeleton width={150} height={20} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {Array(6).fill(0).map((_, index) => (
            <div key={index} className="text-center">
              <Skeleton circle height={128} width={128} className="mx-auto mb-2" />
              <Skeleton width={100} height={16} className="mx-auto" />
              <Skeleton width={50} height={20} className="mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </SkeletonTheme>
  );

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen p-5" dir="rtl">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <ChartSkeleton />
              <ChartSkeleton />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <MapSkeleton />
              <ChartSkeleton />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <ChartSkeleton />
              <ChartSkeleton />
            </div>
            <ChartSkeleton />
            <KPISkeleton />
            <ChartSkeleton />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <ChartSkeleton />
              <ChartSkeleton />
            </div>
            {Array(3).fill(0).map((_, index) => <ChartSkeleton key={index} />)}
            <ChartSkeleton />
            <ChartSkeleton />
            <div className="bg-white rounded-xl p-6 shadow-sm mb-5">
              <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
                <Skeleton width={80} height={20} />
                <Skeleton width={150} height={20} />
              </div>
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-2 w-full md:w-2/3">
                  <Skeleton height={256} />
                </div>
                <div className="flex-1 w-full md:w-1/3 text-center">
                  <Skeleton circle height={200} width={200} className="mx-auto" />
                </div>
              </div>
            </div>
            <ChartSkeleton />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen p-5" dir="rtl">
        <Head>
          <title>التقارير</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta name="description" content="لوحة تحليلات بيانية" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet" />
          <script src="https://code.highcharts.com/maps/highmaps.js"></script>
          <script src="https://code.highcharts.com/maps/modules/exporting.js"></script>
        </Head>

        <style jsx global>{`
          body {
            font-family: 'Tajawal', sans-serif;
          }
          #map-container {
            height: 400px;
            min-width: 310px;
            max-width: 800px;
            margin: 0 auto;
          }
          .loading {
            margin-top: 10em;
            text-align: center;
            color: gray;
          }
          .error {
            margin-top: 10em;
            text-align: center;
            color: red;
          }
        `}</style>

        <div className="max-w-7xl mx-auto">
          {/* Row 1: إحصائيات الطلبات ومعدل النمو */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
                <div className="flex items-center gap-4">
                  <select
                    value={ordersPeriod}
                    onChange={(e) => setOrdersPeriod(e.target.value)}
                    className="bg-white text-black  py-1 rounded text-sm"
                  >
                    <option value="week">أسبوعي</option>
                    <option value="month">شهري</option>
                    <option value="year">سنوي</option>
                    <option value="custom">مخصص</option>
                  </select>
                  {ordersPeriod === 'custom' && (
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={ordersStartDate}
                        onChange={(e) => setOrdersStartDate(e.target.value)}
                        className="border rounded px-2 py-1"
                      />
                      <input
                        type="date"
                        value={ordersEndDate}
                        onChange={(e) => setOrdersEndDate(e.target.value)}
                        className="border rounded px-2 py-1"
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <h3 className="text-base font-semibold text-gray-800">إحصائيات الطلبات</h3>
                  <button
                    onClick={() => openModal('إحصائيات الطلبات', ['الحالة', 'العدد'], ordersTableData)}
                    className="bg-teal-700 text-white px-4 py-2 rounded text-sm hover:bg-teal-800"
                  >
                    عرض الجدول
                  </button>
                </div>
              </div>
              <div className="relative h-64">
                <Doughnut data={donutChart1Data} options={donutOptions} />
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
                <div className="flex items-center gap-4">
                  <select
                    value={growthPeriod}
                    onChange={(e) => setGrowthPeriod(e.target.value)}
                    className="bg-white text-black py-1 rounded text-sm"
                  >
                    <option value="week">أسبوعي</option>
                    <option value="month">شهري</option>
                    <option value="year">سنوي</option>
                    <option value="custom">مخصص</option>
                  </select>
                  {growthPeriod === 'custom' && (
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={growthStartDate}
                        onChange={(e) => setGrowthStartDate(e.target.value)}
                        className="border rounded px-2 py-1"
                      />
                      <input
                        type="date"
                        value={growthEndDate}
                        onChange={(e) => setGrowthEndDate(e.target.value)}
                        className="border rounded px-2 py-1"
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <h3 className="text-base font-semibold text-gray-800">
                    {growthPeriod === 'week' ? 'معدل النمو الأسبوعي' : growthPeriod === 'month' ? 'معدل النمو اليومي' : growthPeriod === 'custom' ? 'معدل النمو للفترة' : 'معدل النمو الشهري'}
                  </h3>
                  <button
                    onClick={() => openModal('معدل النمو', ['الفترة', 'العدد'], growthRateTableData)}
                    className="bg-teal-700 text-white px-4 py-2 rounded text-sm hover:bg-teal-800"
                  >
                    عرض الجدول
                  </button>
                </div>
              </div>
              <div className="relative h-64">
                <Line data={lineChart1Data} options={commonOptions} />
              </div>
            </div>
          </div>

          {/* Row 2: الخريطة وتوزيع المصادر */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
                <span className="bg-teal-800 text-white px-3 py-1 rounded text-sm">جغرافي</span>
                <div className="flex items-center gap-4">
                  <h3 className="text-base font-semibold text-gray-800">إحصائيات المدن\المصادر</h3>
                  <button
                    onClick={() => openModal('إحصائيات المدن', ['المدينة', 'العدد'], citiesTableData)}
                    className="bg-teal-700 text-white px-4 py-2 rounded text-sm hover:bg-teal-800"
                  >
                    عرض الجدول
                  </button>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-5">
                خريطة تفاعلية بسيطة للمملكة العربية السعودية توضح عدد العملاء حسب المنطقة.
              </p>
              {mapLoaded ? (
                <div id="map-container"></div>
              ) : (
                <div className="loading">جاري تحميل الخريطة...</div>
              )}
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
                <span className="bg-teal-800 text-white px-3 py-1 rounded text-sm">مصادر</span>
                <div className="flex items-center gap-4">
                  <h3 className="text-base font-semibold text-gray-800">توزيع العملاء حسب المصدر</h3>
                  <button
                    onClick={() => openModal('توزيع العملاء حسب المصدر', ['المصدر', 'العدد'], sourcesTableData)}
                    className="bg-teal-700 text-white px-4 py-2 rounded text-sm hover:bg-teal-800"
                  >
                    عرض الجدول
                  </button>
                </div>
              </div>
              <div className="relative h-[500px]">
                <Bar data={donutChart4Data} options={{ 
                  responsive: true, 
                  maintainAspectRatio: false, 
                  plugins: {
                    legend: {
                      display: false,
                    },
                    tooltip: {
                      enabled: true,
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      titleFont: { family: '"Tajawal", sans-serif' },
                      bodyFont: { family: '"Tajawal", sans-serif' },
                      callbacks: {
                        title: (context: any) => {
                          return context[0].label || 'المصدر';
                        },
                        label: (context: any) => {
                          return `عدد العملاء: ${context.parsed.y}`;
                        }
                      }
                    }
                  },
                  scales: { 
                    y: { 
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'عدد العملاء',
                        font: { family: '"Tajawal", sans-serif', size: 14 }
                      }
                    },
                    x: {
                      grid: { display: false },
                      title: {
                        display: true,
                        text: 'المصدر',
                        font: { family: '"Tajawal", sans-serif', size: 14 }
                      }
                    }
                  } 
                }} />
              </div>
            </div>
          </div>

          {/* Row 3: توزيع المستحقات وإحصائيات المهام */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
                <h3 className="text-base font-semibold text-gray-800">توزيع المستحقات</h3>
                <button
                  onClick={() => openModal('توزيع المستحقات', ['الحالة', 'العدد'], receivablesTableData)}
                  className="bg-teal-700 text-white px-4 py-2 rounded text-sm hover:bg-teal-800"
                >
                  عرض الجدول
                </button>
              </div>
              <div className="relative h-64">
                <Doughnut data={donutChart2Data} options={donutOptions} />
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
                <h3 className="text-base font-semibold text-gray-800">إحصائيات المهام</h3>
                <button
                  onClick={() => openModal('إحصائيات المهام', ['الشهر', 'المهام المكتملة', 'المهام غير المكتملة'], tasksTableData)}
                  className="bg-teal-700 text-white px-4 py-2 rounded text-sm hover:bg-teal-800"
                >
                  عرض الجدول
                </button>
              </div>
              <div className="relative h-64">
                {tasksData?.timeSeriesData?.labels?.length > 0 ? (
                  <Bar data={barChart2Data} options={barChart2Options} />
                ) : (
                  <div className="text-center text-gray-500">لا توجد بيانات مهام متاحة لهذه الفترة.</div>
                )}
              </div>
            </div>
          </div>

          {/* Row 4: الطلبات حسب الشهر */}
          <div className="bg-white rounded-xl p-6 shadow-sm mb-5">
            <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
              <span className="bg-teal-800 text-white px-3 py-1 rounded text-sm">تحليل سنوي</span>
              <div className="flex items-center gap-4">
                <h3 className="text-base font-semibold text-gray-800">الطلبات حسب الشهر</h3>
                <button
                  onClick={() => openModal('الطلبات حسب الشهر', ['الشهر', 'العدد'], monthlyOrdersTableData)}
                  className="bg-teal-700 text-white px-4 py-2 rounded text-sm hover:bg-teal-800"
                >
                  عرض الجدول
                </button>
              </div>
            </div>
            <div className="relative h-80">
              <Bar data={barChart3Data} options={commonOptions} />
            </div>
          </div>

          {/* Row 5: إحصائيات التسكين حسب الجنسية */}
          <div className="bg-white rounded-xl p-6 shadow-sm mb-5">
            <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
              <span className="bg-teal-800 text-white px-3 py-1 rounded text-sm">توزيع</span>
              <div className="flex items-center gap-4">
                <h3 className="text-base font-semibold text-gray-800">إحصائيات التسكين حسب الجنسية</h3>
                <button
                  onClick={() => openModal('إحصائيات التسكين حسب الجنسية', ['السبب', 'الجنسية', 'العدد', 'النسبة'], housedWorkersTableData)}
                  className="bg-teal-700 text-white px-4 py-2 rounded text-sm hover:bg-teal-800"
                >
                  عرض الجدول
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {miniDonutData.map((item, index) => (
                <div key={index} className="text-center">
                  <div className="w-40 h-40 mx-auto mb-2">
                    {item.chartData.labels.length > 0 ? (
                      <Doughnut
                        data={item.chartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: true,
                          plugins: {
                            legend: {
                              display: true,
                              position: 'bottom' as const,
                              labels: {
                                font: { family: '"Tajawal", sans-serif', size: 11 },
                                padding: 8,
                                boxWidth: 12,
                                boxHeight: 12,
                              },
                            },
                            tooltip: {
                              enabled: true,
                              backgroundColor: 'rgba(0, 0, 0, 0.8)',
                              titleFont: { family: '"Tajawal", sans-serif' },
                              bodyFont: { family: '"Tajawal", sans-serif' },
                              callbacks: {
                                label: (context: any) => {
                                  const label = context.label || '';
                                  const value = context.parsed || 0;
                                  const total = item.data.reduce((sum, d) => sum + d.count, 0);
                                  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                  return `${label}: ${value} (${percentage}%)`;
                                },
                              },
                            },
                          },
                        }}
                      />
                    ) : (
                      <div className="text-sm text-gray-500 pt-16">لا توجد بيانات</div>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 font-semibold mb-2">{item.reason}</div>
                  {item.data.length > 0 ? (
                    item.data.map((d, i) => (
                      <div key={i} className="text-xs text-gray-800">
                        {d.country}: {d.percentage}% ({d.count})
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-500">لا توجد بيانات</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Row 6: إحصائيات الإعاشة */}
          <div className="bg-white rounded-xl p-6 shadow-sm mb-5">
            <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
              <span className="bg-teal-800 text-white px-3 py-1 rounded text-sm">إعاشة</span>
              <div className="flex items-center gap-4">
                <h3 className="text-base font-semibold text-gray-800">إحصائيات الإعاشة</h3>
                <button
                  onClick={() => openModal('إحصائيات الإعاشة', ['الموقع', 'السعة الإجمالية', 'عدد العاملين', 'نسبة الإشغال'], inLocationsTableData)}
                  className="bg-teal-700 text-white px-4 py-2 rounded text-sm hover:bg-teal-800"
                >
                  عرض الجدول
                </button>
              </div>
            </div>
            <div className="relative h-64">
              {inLocationsData?.length > 0 ? (
                <Bar data={inLocationBarChartData} options={inLocationBarChartOptions} />
              ) : (
                <div className="text-center text-gray-500">لا توجد بيانات إعاشة متاحة.</div>
              )}
            </div>
          </div>

          {/* Row 7: تحليل الاتجاهات الزمنية */}
          <div className="bg-white rounded-xl p-6 shadow-sm mb-5">
            <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
              <span className="bg-teal-800 text-white px-3 py-1 rounded text-sm">اتجاه</span>
              <div className="flex items-center gap-4">
                <h3 className="text-base font-semibold text-gray-800">تحليل الاتجاهات الزمنية</h3>
                <button
                  onClick={() => openModal('تحليل الاتجاهات الزمنية', ['الشهر', 'العدد'], trendsTableData)}
                  className="bg-teal-700 text-white px-4 py-2 rounded text-sm hover:bg-teal-800"
                >
                  عرض الجدول
                </button>
              </div>
            </div>
            <div className="relative h-80">
              <Line data={lineChart2Data} options={commonOptions} />
            </div>
          </div>

          {/* Row 8: أداء الفريق */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
                <span className="bg-teal-800 text-white px-3 py-1 rounded text-sm">مقارنة</span>
                <div className="flex items-center gap-4">
                  <h3 className="text-base font-semibold text-gray-800">أداء الفريق - النصف الأول</h3>
                  <button
                    onClick={() => openModal('أداء الفريق - النصف الأول', ['الفريق', 'الأداء'], teamPerformance1TableData)}
                    className="bg-teal-700 text-white px-4 py-2 rounded text-sm hover:bg-teal-800"
                  >
                    عرض الجدول
                  </button>
                </div>
              </div>
              <div className="relative h-64">
                <Bar data={barChart4Data} options={{ ...commonOptions, scales: { y: { beginAtZero: true, max: 100 } } }} />
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
                <span className="bg-teal-800 text-white px-3 py-1 rounded text-sm">مقارنة</span>
                <div className="flex items-center gap-4">
                  <h3 className="text-base font-semibold text-gray-800">أداء الفريق - النصف الثاني</h3>
                  <button
                    onClick={() => openModal('أداء الفريق - النصف الثاني', ['الفريق', 'الأداء'], teamPerformance2TableData)}
                    className="bg-teal-700 text-white px-4 py-2 rounded text-sm hover:bg-teal-800"
                  >
                    عرض الجدول
                  </button>
                </div>
              </div>
              <div className="relative h-64">
                <Bar data={barChart5Data} options={{ ...commonOptions, scales: { y: { beginAtZero: true, max: 100 } } }} />
              </div>
            </div>
          </div>

          {/* Rows 9-11: تحليل شامل */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm mb-5">
              <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
                <span className="bg-teal-800 text-white px-3 py-1 rounded text-sm">تفصيلي</span>
                <div className="flex items-center gap-4">
                  <h3 className="text-base font-semibold text-gray-800">تحليل شامل - المجموعة {i}</h3>
                  <button
                    onClick={() => openModal(`تحليل شامل - المجموعة ${i}`, ['الشهر', '2023', '2024', '2025', 'المجموعة'], groupedBarTableData.filter((item) => item['المجموعة'] === `المجموعة ${i}`))}
                    className="bg-teal-700 text-white px-4 py-2 rounded text-sm hover:bg-teal-800"
                  >
                    عرض الجدول
                  </button>
                </div>
              </div>
              <div className="relative h-96">
                <Bar data={groupedBarData[i - 1]} options={groupedBarOptions} />
              </div>
            </div>
          ))}

          {/* Row 12: التوقعات المستقبلية */}
          <div className="bg-white rounded-xl p-6 shadow-sm mb-5">
            <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
              <span className="bg-teal-800 text-white px-3 py-1 rounded text-sm">تنبؤات</span>
              <div className="flex items-center gap-4">
                <h3 className="text-base font-semibold text-gray-800">التوقعات المستقبلية</h3>
                <button
                  onClick={() => openModal('التوقعات المستقبلية', ['الشهر', 'الفعلي', 'المتوقع'], forecastTableData1)}
                  className="bg-teal-700 text-white px-4 py-2 rounded text-sm hover:bg-teal-800"
                >
                  عرض الجدول
                </button>
              </div>
            </div>
            <div className="relative h-80">
              <Line data={lineChart34Data[0]} options={lineChart34Options} />
            </div>
          </div>

          {/* Row 13: مقارنة الأداء السنوي */}
          <div className="bg-white rounded-xl p-6 shadow-sm mb-5">
            <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
              <span className="bg-teal-800 text-white px-3 py-1 rounded text-sm">مقارنة</span>
              <div className="flex items-center gap-4">
                <h3 className="text-base font-semibold text-gray-800">مقارنة الأداء السنوي</h3>
                <button
                  onClick={() => openModal('مقارنة الأداء السنوي', ['الشهر', 'الفعلي', 'المتوقع'], forecastTableData2)}
                  className="bg-teal-700 text-white px-4 py-2 rounded text-sm hover:bg-teal-800"
                >
                  عرض الجدول
                </button>
              </div>
            </div>
            <div className="relative h-80">
              <Line data={lineChart34Data[1]} options={lineChart34Options} />
            </div>
          </div>

          {/* Row 14: نظرة عامة على الأداء */}
          <div className="bg-white rounded-xl p-6 shadow-sm mb-5">
            <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
              <span className="bg-teal-800 text-white px-3 py-1 rounded text-sm">ملخص</span>
              <div className="flex items-center gap-4">
                <h3 className="text-base font-semibold text-gray-800">نظرة عامة على الأداء</h3>
                <button
                  onClick={() => openModal('نظرة عامة على الأداء', ['الشهر', 'العدد'], performanceOverviewTableData)}
                  className="bg-teal-700 text-white px-4 py-2 rounded text-sm hover:bg-teal-800"
                >
                  عرض الجدول
                </button>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-2 w-full md:w-2/3">
                <div className="relative h-64">
                  <Bar data={barChart6Data} options={commonOptions} />
                </div>
              </div>
              <div className="flex-1 w-full md:w-1/3 text-center">
                <div className="max-w-xs mx-auto">
                  <Doughnut data={donutChart3Data} options={donutChart3Options} />
                  <button
                    onClick={() => openModal('إكمال المهام', ['الحالة', 'العدد'], taskCompletionTableData)}
                    className="bg-teal-700 text-white px-4 py-2 rounded text-sm hover:bg-teal-800 mt-4"
                  >
                    عرض الجدول
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Row 15: التقرير النهائي */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
              <span className="bg-teal-800 text-white px-3 py-1 rounded text-sm">نهائي</span>
              <div className="flex items-center gap-4">
                <h3 className="text-base font-semibold text-gray-800">التقرير النهائي</h3>
                <button
                  onClick={() => openModal('التقرير النهائي', ['الشهر', 'العدد'], finalReportTableData)}
                  className="bg-teal-700 text-white px-4 py-2 rounded text-sm hover:bg-teal-800"
                >
                  عرض الجدول
                </button>
              </div>
            </div>
            <div className="relative h-80">
              <Bar data={barChart7Data} options={commonOptions} />
            </div>
          </div>
        </div>

        {/* Modal */}
        <DataTableModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={modalTitle}
          columns={modalColumns}
          data={modalData}
        />
      </div>
    </Layout>
  );
}