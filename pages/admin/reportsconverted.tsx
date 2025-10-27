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

export default function Home() {
  // Color palette
  const primaryColor = '#2d7a7a';
  const secondaryColor = '#45a5a5';
  const tertiaryColor = '#6fc9c9';
  const lightColor = '#a8e0e0';

  // State for real data from APIs

  const [reportsData, setReportsData] = useState<any>(null);
  const [inLocationsData, setInLocationsData] = useState<any>(null);
  const [housedWorkerData, setHousedWorkerData] = useState<any>(null);
  const [ordersData, setOrdersData] = useState<any>(null);
  const [governmentalData, setGovernmentalData] = useState<any>(null);
  const [clientsData, setClientsData] = useState<any>(null);
  const [tasksData, setTasksData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapTopology, setMapTopology] = useState<any>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  // States for dynamic period selection
  const [period, setPeriod] = useState<string>('year');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
const fetchHousedWorkerData = async () => {
  try {
    const response = await fetch('/api/reports/housedworker', {
      method: period === 'custom' ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: period === 'custom' ? JSON.stringify({ period, startDate, endDate }) : undefined,
    });
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
  // Region mapping
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

  // Fetch data from all APIs
  useEffect(() => {
    fetchHousedWorkerData();
    fetchInLocationsData();
    const fetchAllData = async () => {
      try {
        setLoading(true);

        // تحديد معايير البحث
        const requestBody = period === 'custom' ? { period, startDate, endDate } : { period };

        // Fetch tasks data
        const tasksResponse = await fetch('/api/reports/tasks', {
          method: period === 'custom' ? 'POST' : 'GET',
          headers: { 'Content-Type': 'application/json' },
          body: period === 'custom' ? JSON.stringify(requestBody) : undefined,
        });
        const tasks = await tasksResponse.json();
        setTasksData(tasks);

        // Fetch other APIs
        const ordersResponse = await fetch('/api/reports/orders', {
          method: period === 'custom' ? 'POST' : 'GET',
          headers: { 'Content-Type': 'application/json' },
          body: period === 'custom' ? JSON.stringify(requestBody) : undefined,
        });
        const orders = await ordersResponse.json();
        setOrdersData(orders);

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
  }, [period, startDate, endDate]);

  // Prepare map data
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

  // Load Highcharts + map module + topology
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initMap = async () => {
      try {
        const loadHighcharts = async () => {
          if (!window.Highcharts) {
            await new Promise<void>((resolve) => {
              const script = document.createElement('script');
              script.src = 'https://code.highcharts.com/maps/highmaps.js';
              script.onload = () => {
                const exportScript = document.createElement('script');
                exportScript.src = 'https://code.highcharts.com/maps/modules/exporting.js';
                exportScript.onload = () => resolve();
                exportScript.onerror = () => resolve();
                document.head.appendChild(exportScript);
              };
              script.onerror = () => resolve();
              document.head.appendChild(script);
            });
          }

          if (mapData.length === 0) {
            setMapLoaded(true);
            return;
          }

          try {
            const res = await fetch('https://code.highcharts.com/mapdata/countries/sa/sa-all.topo.json');
            const topology = await res.json();

            window.Highcharts.mapChart('map-container', {
              chart: { map: topology },
              title: { text: 'العملاء حسب المدينة' },
              mapNavigation: { enabled: true },
              colorAxis: {
                min: 0,
                minColor: '#14B8A6',
                maxColor: '#134E4A',
              },
              tooltip: {
                headerFormat: '',
                pointFormat: '<b>{point.name}</b>: {point.value}',
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                style: {
                  color: '#fff',
                  fontFamily: '"Tajawal", sans-serif',
                  fontSize: '14px',
                  direction: 'rtl',
                },
                useHTML: true,
              },
              series: [{
                data: mapData,
                joinBy: ['hc-key', 'hc-key'],
                name: 'عدد العملاء',
                nullColor: '#14B8A6',
                borderColor: '#F5FF57',
                borderWidth: 1,
                states: {
                  hover: { color: '#BADA55', borderColor: '#333', borderWidth: 2 }
                },
                dataLabels: {
                  enabled: true,
                  format: '{point.name}',
                  style: {
                    textOutline: 'none',
                    color: '#000',
                    fontSize: '12px',
                    fontFamily: '"Tajawal", sans-serif',
                  }
                }
              }]
            });
            setMapLoaded(true);
          } catch (err) {
            console.error('فشل تحميل topology:', err);
            setMapLoaded(true);
          }
        };

        loadHighcharts();
      } catch (err) {
        console.error('فشل تحميل الخريطة:', err);
        setMapError((err as Error).message || 'خطأ غير معروف أثناء تحميل الخريطة');
      } finally {
        setMapLoaded(true);
      }
    };

    initMap();
  }, [mapData]);



const inLocationBarChartData = {
  labels: inLocationsData?.map((item: any) => item.location) || [],
  datasets: [
    {
      label: 'نسبة الإشغال (%)',
      data: inLocationsData?.map((item: any) => item.occupancyPercentage) || [],
      backgroundColor: primaryColor,
      borderColor: primaryColor,
      borderWidth: 1,
    },
  ],
};
const inLocationBarChartOptions = {
  responsive: true,
  scales: {
    y: {
      beginAtZero: true,
      max: 100,
      title: {
        display: true,
        text: 'نسبة الإشغال (%)',
        font: { family: '"Tajawal", sans-serif', size: 14 },
      },
    },
    x: {
      grid: { display: false },
      title: {
        display: true,
        text: 'الموقع',
        font: { family: '"Tajawal", sans-serif', size: 14 },
      },
    },
  },
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      labels: {
        font: {
          family: '"Tajawal", sans-serif',
          size: 14,
        },
      },
    },
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
  scales: {
    y: {
      beginAtZero: true,
      max: 100, // النسبة مابين 0 و100
      title: {
        display: true,
        text: 'نسبة الإشغال (%)',
        font: { family: '"Tajawal", sans-serif', size: 14 },
      },
    },
    x: {
      grid: { display: false },
      title: {
        display: true,
        text: 'الموقع',
        font: { family: '"Tajawal", sans-serif', size: 14 },
      },
    },
  },
};
  
  // Chart Data
  // Donut Chart 1 - Order Status Distribution
  const donutChart1Data = {
    labels: ['جديد', 'قيد التنفيذ', 'مكتمل', 'ملغي'],
    datasets: [{
      data: [
        ordersData?.new_order || 0,
        ordersData?.in_progress || 0,
        ordersData?.delivered || 0,
        ordersData?.cancelled || 0
      ],
      backgroundColor: ["#600000", "#F8DADA", "lightblue", tertiaryColor]
    }],
  };

  // Line Chart 1 - Orders by Period (Dynamic)
  const lineChart1Data = {
    labels:
      period === 'year'
        ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
        : ordersData?.timeSeriesData?.labels?.map((label: string) => {
            if (period === 'week' || period === 'month' || period === 'custom') {
              return new Date(label).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' });
            }
            return label;
          }) || [],
    datasets: [{
      data: ordersData?.timeSeriesData?.data || Array(period === 'year' ? 12 : 7).fill(0),
      borderColor: primaryColor,
      backgroundColor: 'rgba(45, 122, 122, 0.1)',
      tension: 0.4,
      fill: true,
    }],
  };

  // Donut Chart 4 - Sources Distribution
  const donutChart4Data = {
    labels: ordersData?.SourcesStats?.map((item: any) => item.Source) || ['تويتر', 'فيسبوك', 'أخرى'],
    datasets: [{
      data: ordersData?.SourcesStats?.map((item: any) => item._count.id) || [0, 0, 0],
      backgroundColor: [primaryColor, secondaryColor, tertiaryColor, lightColor],
    }],
  };

// Bar Chart 2 - Tasks by Completion Status (Dual-Column)

// Bar Chart 2 - Tasks by Completion Status (Dual-Column)
const barChart2Data = {
  labels: tasksData?.timeSeriesData?.labels?.length > 0
    ? tasksData.timeSeriesData.labels
    : ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  datasets: [
    {
      label: 'المهام المكتملة',
      data: tasksData?.timeSeriesData?.completedData?.length > 0
        ? tasksData.timeSeriesData.completedData
        : Array(12).fill(0),
      backgroundColor: primaryColor,
      borderColor: primaryColor,
      borderWidth: 1,
    },
    {
      label: 'المهام غير المكتملة',
      data: tasksData?.timeSeriesData?.incompleteData?.length > 0
        ? tasksData.timeSeriesData.incompleteData
        : Array(12).fill(0),
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
    legend: {
      display: true,
      position: 'top' as const,
      labels: {
        font: {
          family: '"Tajawal", sans-serif',
          size: 14,
        },
      },
    },
    tooltip: {
      enabled: true,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleFont: { family: '"Tajawal", sans-serif' },
      bodyFont: { family: '"Tajawal", sans-serif' },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'عدد المهام',
        font: { family: '"Tajawal", sans-serif', size: 14 },
      },
    },
    x: {
      grid: { display: false },
      title: {
        display: true,
        text: 'الأشهر',
        font: { family: '"Tajawal", sans-serif', size: 14 },
      },
    },
  },
};


  // Donut Chart - Tasks Priority Distribution
  const donutChartTasksPriorityData = {
    labels: tasksData?.priorityStats?.map((item: any) => item.priority || 'غير محدد') || ['غير محدد'],
    datasets: [{
      data: tasksData?.priorityStats?.map((item: any) => item.count) || [0],
      backgroundColor: [primaryColor, secondaryColor, tertiaryColor, lightColor],
    }],
  };

  // Donut Chart 2 - Clients with/without Receivables
  const donutChart2Data = {
    labels: ['لديهم مستحقات', 'بدون مستحقات'],
    datasets: [{
      data: [
        reportsData?.clientsReceivables?.withReceivables || 0,
        reportsData?.clientsReceivables?.withoutReceivables || 0
      ],
      backgroundColor: [primaryColor, secondaryColor]
    }],
  };

  // Bar Chart 3 - Annual Orders
  const barChart3Data = {
    labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    datasets: [{
      data: ordersData?.timeSeriesData?.data || Array(12).fill(0),
      backgroundColor: primaryColor
    }],
  };

const reasons = [
  'نقل كفالة',
  'مشكلة مكتب العمل',
  'انتظار الترحيل',
  'رفض العامل لنقل الكفالة',
  'هروب العاملة',
  'رفض العامل للسفر',
];

// إعداد البيانات للـ mini donut charts
const miniDonutData = reasons.map((reason) => {
  const reasonData = housedWorkerData?.nationalityStats?.[reason] || {};
  const total = housedWorkerData?.total || 1;
  const nationalities = Object.keys(reasonData);
  const colors = [primaryColor, secondaryColor, tertiaryColor, lightColor]; // ألوان مختلفة للجنسيات

  return {
    reason,
    datasets: nationalities.map((country, i) => ({
      label: country,
      data: [reasonData[country]?.count || 0, total - (reasonData[country]?.count || 0)],
      backgroundColor: [colors[i % colors.length], '#e8f4f4'],
      borderWidth: 0,
    })),
    data: nationalities.map((country) => ({
      country,
      count: reasonData[country]?.count || 0,
      percentage: reasonData[country]?.percentage || 0,
    })),
  };
});
  // Line Chart 2 - Trends
  const lineChart2Data = {
    labels: Array.from({ length: 12 }, (_, i) => `الشهر ${i + 1}`),
    datasets: [{
      data: ordersData?.timeSeriesData?.data || Array(12).fill(0),
      borderColor: primaryColor,
      backgroundColor: 'rgba(45, 122, 122, 0.1)',
      tension: 0.4,
      fill: true
    }],
  };

  // Team Performance
  const teamData = [85, 92, 78, 88, 95, 82];
  const barChart4Data = {
    labels: ['الفريق 1', 'الفريق 2', 'الفريق 3', 'الفريق 4', 'الفريق 5', 'الفريق 6'],
    datasets: [{
      data: teamData.map((v) => v + Math.random() * 10 - 5),
      backgroundColor: primaryColor
    }],
  };

  const barChart5Data = {
    labels: ['الفريق 1', 'الفريق 2', 'الفريق 3', 'الفريق 4', 'الفريق 5', 'الفريق 6'],
    datasets: [{
      data: teamData.map((v) => v + Math.random() * 10 - 5),
      backgroundColor: primaryColor
    }],
  };

  // Grouped Bar Data
  const groupedBarData = Array.from({ length: 3 }, () => ({
    labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    datasets: [
      { label: '2023', data: Array.from({ length: 12 }, () => Math.floor(Math.random() * 50) + 30), backgroundColor: primaryColor },
      { label: '2024', data: ordersData?.timeSeriesData?.data || Array(12).fill(0), backgroundColor: secondaryColor },
      { label: '2025', data: Array.from({ length: 12 }, () => Math.floor(Math.random() * 50) + 50), backgroundColor: tertiaryColor },
    ],
  }));

  // Line Chart 3 & 4 - Forecasts
  const lineChart34Data = Array.from({ length: 2 }, () => ({
    labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    datasets: [
      { label: 'الفعلي', data: ordersData?.timeSeriesData?.data || Array(12).fill(0), borderColor: primaryColor, tension: 0.4 },
      { label: 'المتوقع', data: Array.from({ length: 12 }, () => Math.floor(Math.random() * 40) + 70), borderColor: secondaryColor, borderDash: [5, 5], tension: 0.4 },
    ],
  }));

  // Bar Chart 6 - Performance Overview
  const barChart6Data = {
    labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس'],
    datasets: [{
      data: ordersData?.timeSeriesData?.data?.slice(0, 8) || [0, 0, 0, 0, 0, 0, 0, 0],
      backgroundColor: primaryColor
    }],
  };

  // Donut Chart 3 - Task Completion
  const donutChart3Data = {
    labels: ['مكتمل', 'غير مكتمل'],
    datasets: [{
      data: [
        tasksData?.completed || 0,
        tasksData?.incomplete || 0
      ],
      backgroundColor: [primaryColor, lightColor]
    }],
  };

  // Bar Chart 7 - Final Report
  const barChart7Data = {
    labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    datasets: [{
      data: ordersData?.timeSeriesData?.data || Array(12).fill(0),
      backgroundColor: primaryColor
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

  // Skeleton component for charts
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

  // Skeleton component for map
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

  // Skeleton component for KPI section
  const KPISkeleton = () => (
    <SkeletonTheme baseColor="#e5e7eb" highlightColor="#f3f4f6">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
          <Skeleton width={80} height={20} />
          <Skeleton width={150} height={20} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {Array(6)
            .fill(0)
            .map((_, index) => (
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

  // Loading state with skeleton UI
  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen p-5" dir="rtl">
          <div className="max-w-7xl mx-auto">
            {/* Row 1: Two charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <ChartSkeleton />
              <ChartSkeleton />
            </div>
            {/* Row 2: Map and chart */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <MapSkeleton />
              <ChartSkeleton />
            </div>
            {/* Row 3: Two charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <ChartSkeleton />
              <ChartSkeleton />
            </div>
            {/* Row 3.5: Tasks Priority Distribution */}
            <ChartSkeleton />
            {/* Row 4: Single chart */}
            <ChartSkeleton />
            {/* Row 5: KPI section */}
            <KPISkeleton />
            {/* Row 6: Single chart */}
            <ChartSkeleton />
            {/* Row 7: Two charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <ChartSkeleton />
              <ChartSkeleton />
            </div>
            {/* Row 8-10: Grouped bar charts */}
            {Array(3)
              .fill(0)
              .map((_, index) => (
                <ChartSkeleton key={index} />
              ))}
            {/* Row 11-12: Forecast charts */}
            <ChartSkeleton />
            <ChartSkeleton />
            {/* Row 13: Performance overview */}
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
            {/* Row 14: Final report */}
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
          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5 bg-white rounded-xl">
            <div className="bg-white p-6">
              <div className="flex justify-between items-center mb-5 pb-4 border-b-2">
                <div className="flex items-center gap-4">
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="bg-teal-800 text-white px-3 py-1 rounded text-sm"
                  >
                    <option value="week">أسبوعي</option>
                    <option value="month">شهري</option>
                    <option value="year">سنوي</option>
                    <option value="custom">مخصص</option>
                  </select>
                  {period === 'custom' && (
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border rounded px-2 py-1"
                      />
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border rounded px-2 py-1"
                      />
                    </div>
                  )}
                </div>
                <h3 className="text-base font-semibold text-gray-800">إحصائيات الطلبات</h3>
              </div>
              <div className="relative h-64">
                <Doughnut data={donutChart1Data} options={donutOptions} />
              </div>
            </div>
            <div className="bg-white p-6">
              <div className="flex justify-between items-center mb-5 pb-4 border-b-2">
                <div className="flex items-center gap-4">
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="bg-teal-800 text-white px-3 py-1 rounded text-sm"
                  >
                    <option value="week">أسبوعي</option>
                    <option value="month">شهري</option>
                    <option value="year">سنوي</option>
                    <option value="custom">مخصص</option>
                  </select>
                  {period === 'custom' && (
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border rounded px-2 py-1"
                      />
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border rounded px-2 py-1"
                      />
                    </div>
                  )}
                </div>
                <h3 className="text-base font-semibold text-gray-800">
                  {period === 'week' ? 'معدل النمو الأسبوعي' : period === 'month' ? 'معدل النمو اليومي' : period === 'custom' ? 'معدل النمو للفترة' : 'معدل النمو الشهري'}
                </h3>
              </div>
              <div className="relative h-64">
                <Line data={lineChart1Data} options={commonOptions} />
              </div>
            </div>
          </div>

          {/* Row 2 - Highcharts Map and Sources Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
                <span className="bg-teal-800 text-white px-3 py-1 rounded text-sm">جغرافي</span>
                <h3 className="text-base font-semibold text-gray-800">إحصائيات المدن\المصادر</h3>
              </div>
              <p className="text-gray-600 text-sm mb-5">
                خريطة تفاعلية بسيطة للمملكة العربية السعودية توضح عدد العملاء حسب المنطقة. الألوان تشير إلى كثافة العملاء.
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
                <h3 className="text-base font-semibold text-gray-800">توزيع العملاء حسب المصدر</h3>
              </div>
              <div className="relative h-[500px]">
                <Bar data={donutChart4Data} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100 } } }} />
              </div>
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
                <h3 className="text-base font-semibold text-gray-800">توزيع المستحقات</h3>
              </div>
              <div className="relative h-64">
                <Doughnut data={donutChart2Data} options={donutOptions} />
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
                <h3 className="text-base font-semibold text-gray-800">احصائيات المهام</h3>
              </div>
             <div className="bg-white rounded-xl p-6 shadow-sm">
  <div className="relative h-64">
    {tasksData?.timeSeriesData?.labels?.length > 0 ? (
      <Bar data={barChart2Data} options={barChart2Options} />
    ) : (
      <div className="text-center text-gray-500">
        لا توجد بيانات مهام متاحة لهذه الفترة. تحقق من قاعدة البيانات أو الفترة الزمنية.
      </div>
    )}
  </div>
</div>
            </div>
          </div>


          {/* Row 4 */}
          <div className="bg-white rounded-xl p-6 shadow-sm mb-5">
            <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
              <span className="bg-teal-800 text-white px-3 py-1 rounded text-sm">تحليل سنوي</span>
              <h3 className="text-base font-semibold text-gray-800">الطلبات حسب الشهر</h3>
            </div>
            <div className="relative h-80">
              <Bar data={barChart3Data} options={commonOptions} />
            </div>
          </div>

     <div className="bg-white rounded-xl p-6 shadow-sm mb-5">
  <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
    <span className="bg-teal-800 text-white px-3 py-1 rounded text-sm">توزيع</span>
    <h3 className="text-base font-semibold text-gray-800">إحصائيات التسكين حسب الجنسية</h3>
  </div>
  <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
    {miniDonutData.map((item, index) => (
      <div key={index} className="text-center">
        <div className="w-32 h-32 mx-auto mb-2">
          <Doughnut
            data={{ labels: item.data.map((d) => d.country), datasets: item.datasets }}
            options={{
              ...miniDonutOptions,
              plugins: {
                ...miniDonutOptions.plugins,
                legend: { display: true, position: 'bottom', labels: { font: { family: '"Tajawal", sans-serif' } } },
              },
            }}
          />
        </div>
        <div className="text-sm text-gray-500 font-semibold">{item.reason}</div>
        {item.data.length > 0 ? (
          item.data.map((d, i) => (
            <div key={i} className="text-sm text-gray-800">
              {d.country}: {d.percentage}% ({d.count})
            </div>
          ))
        ) : (
          <div className="text-sm text-gray-500">لا توجد بيانات</div>
        )}
      </div>
    ))}
  </div>
</div>

<div className="bg-white rounded-xl p-6 shadow-sm mb-5">
  <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
    <span className="bg-teal-800 text-white px-3 py-1 rounded text-sm">إعاشة</span>
    <h3 className="text-base font-semibold text-gray-800">إحصائيات الإعاشة</h3>
  </div>
  <div className="relative h-64">
    {inLocationsData?.length > 0 ? (
      <Bar data={inLocationBarChartData} options={inLocationBarChartOptions} />
    ) : (
      <div className="text-center text-gray-500">
        لا توجد بيانات إعاشة متاحة. تحقق من قاعدة البيانات أو الاتصال بالـ API.
      </div>
    )}
  </div>
</div>
          {/* Row 6 */}
          <div className="bg-white rounded-xl p-6 shadow-sm mb-5">
            <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
              <span className="bg-teal-800 text-white px-3 py-1 rounded text-sm">اتجاه</span>
              <h3 className="text-base font-semibold text-gray-800">تحليل الاتجاهات الزمنية</h3>
            </div>
            <div className="relative h-80">
              <Line data={lineChart2Data} options={commonOptions} />
            </div>
          </div>

          {/* Row 7 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
                <span className="bg-teal-800 text-white px-3 py-1 rounded text-sm">مقارنة</span>
                <h3 className="text-base font-semibold text-gray-800">أداء الفريق - النصف الأول</h3>
              </div>
              <div className="relative h-64">
                <Bar data={barChart4Data} options={{ ...commonOptions, scales: { y: { beginAtZero: true, max: 100 } } }} />
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
                <span className="bg-teal-800 text-white px-3 py-1 rounded text-sm">مقارنة</span>
                <h3 className="text-base font-semibold text-gray-800">أداء الفريق - النصف الثاني</h3>
              </div>
              <div className="relative h-64">
                <Bar data={barChart5Data} options={{ ...commonOptions, scales: { y: { beginAtZero: true, max: 100 } } }} />
              </div>
            </div>
          </div>

          {/* Rows 8-10 */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm mb-5">
              <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
                <span className="bg-teal-800 text-white px-3 py-1 rounded text-sm">تفصيلي</span>
                <h3 className="text-base font-semibold text-gray-800">تحليل شامل - المجموعة {i}</h3>
              </div>
              <div className="relative h-96">
                <Bar data={groupedBarData[i - 1]} options={groupedBarOptions} />
              </div>
            </div>
          ))}

          {/* Row 11 */}
          <div className="bg-white rounded-xl p-6 shadow-sm mb-5">
            <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
              <span className="bg-teal-800 text-white px-3 py-1 rounded text-sm">تنبؤات</span>
              <h3 className="text-base font-semibold text-gray-800">التوقعات المستقبلية</h3>
            </div>
            <div className="relative h-80">
              <Line data={lineChart34Data[0]} options={lineChart34Options} />
            </div>
          </div>

          {/* Row 12 */}
          <div className="bg-white rounded-xl p-6 shadow-sm mb-5">
            <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
              <span className="bg-teal-800 text-white px-3 py-1 rounded text-sm">مقارنة</span>
              <h3 className="text-base font-semibold text-gray-800">مقارنة الأداء السنوي</h3>
            </div>
            <div className="relative h-80">
              <Line data={lineChart34Data[1]} options={lineChart34Options} />
            </div>
          </div>

          {/* Row 13 */}
          <div className="bg-white rounded-xl p-6 shadow-sm mb-5">
            <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
              <span className="bg-teal-800 text-white px-3 py-1 rounded text-sm">ملخص</span>
              <h3 className="text-base font-semibold text-gray-800">نظرة عامة على الأداء</h3>
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
                </div>
              </div>
            </div>
          </div>

          {/* Row 14 */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
              <span className="bg-teal-800 text-white px-3 py-1 rounded text-sm">نهائي</span>
              <h3 className="text-base font-semibold text-gray-800">التقرير النهائي</h3>
            </div>
            <div className="relative h-80">
              <Bar data={barChart7Data} options={commonOptions} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}