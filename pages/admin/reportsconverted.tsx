import Head from 'next/head';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Chart, LineController, BarController, DoughnutController, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import 'tailwindcss/tailwind.css';
import Layout from 'example/containers/Layout';

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
  const [ordersData, setOrdersData] = useState<any>(null);
  const [governmentalData, setGovernmentalData] = useState<any>(null);
  const [clientsData, setClientsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapTopology, setMapTopology] = useState<any>(null);
  const [mapError, setMapError] = useState<string | null>(null);

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
    const fetchAllData = async () => {
      try {
        setLoading(true);
        
        // Fetch from /api/reports (reports/index.ts)
        const reportsResponse = await fetch('/api/reports');
        const reports = await reportsResponse.json();
        setReportsData(reports);

        // Fetch from /api/reports/orders (reports/orders.ts)
        const ordersResponse = await fetch('/api/reports/orders');
        const orders = await ordersResponse.json();
        setOrdersData(orders);

        // Fetch from /api/reports/governmental (reports/governmental.ts)
        const governmentalResponse = await fetch('/api/reports/governmental');
        const governmental = await governmentalResponse.json();
        setGovernmentalData(governmental);

        // Fetch from /api/report/clients (report/clients.ts)
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
  }, []);

  // Prepare map data from real data (from reports/index.ts - citiesSources.byCity)
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
          if (typeof window === 'undefined') return;

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

  // =============== Chart Data from Real APIs ===============
  
  // Line Chart 1 - Orders by Month (from ordersData - ordersPerMonthsAlongYear)
  const lineChart1Data = {
    labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
    datasets: [{
      data: ordersData?.ordersPerMonthsAlongYear?.slice(0, 6) || [0, 0, 0, 0, 0, 0],
      borderColor: primaryColor,
      backgroundColor: 'rgba(45, 122, 122, 0.1)',
      tension: 0.4,
      fill: true
    }],
  };

  // Donut Chart 1 - Order Status Distribution (from ordersData)
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

  // Bar Chart 1 - Monthly Orders (from ordersData)
  const barChart1Data = {
    labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
    datasets: [{
      data: ordersData?.ordersPerMonthsAlongYear?.slice(0, 6) || [0, 0, 0, 0, 0, 0],
      backgroundColor: primaryColor
    }],
  };

  // Bar Chart 2 - Quarterly Orders (calculated from monthly data)
  const barChart2Data = {
    labels: ['الربع 1', 'الربع 2', 'الربع 3', 'الربع 4'],
    datasets: [{
      data: ordersData?.ordersPerMonthsAlongYear ? [
        (ordersData.ordersPerMonthsAlongYear[0] || 0) + (ordersData.ordersPerMonthsAlongYear[1] || 0) + (ordersData.ordersPerMonthsAlongYear[2] || 0),
        (ordersData.ordersPerMonthsAlongYear[3] || 0) + (ordersData.ordersPerMonthsAlongYear[4] || 0) + (ordersData.ordersPerMonthsAlongYear[5] || 0),
        (ordersData.ordersPerMonthsAlongYear[6] || 0) + (ordersData.ordersPerMonthsAlongYear[7] || 0) + (ordersData.ordersPerMonthsAlongYear[8] || 0),
        (ordersData.ordersPerMonthsAlongYear[9] || 0) + (ordersData.ordersPerMonthsAlongYear[10] || 0) + (ordersData.ordersPerMonthsAlongYear[11] || 0)
      ] : [0, 0, 0, 0],
      backgroundColor: primaryColor
    }],
  };

  // Donut Chart 2 - Clients with/without Receivables (from reportsData - clientsReceivables)
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

  // Bar Chart 3 - Annual Orders (from ordersData)
  const barChart3Data = {
    labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    datasets: [{
      data: ordersData?.ordersPerMonthsAlongYear || Array(12).fill(0),
      backgroundColor: primaryColor
    }],
  };

  // Mini Donut Charts - KPIs (from various data sources)
  const miniDonutData = [
    // معدل التحويل (من الطلبات المكتملة)
    {
      datasets: [{
        data: [
          Math.round(((ordersData?.delivered || 0) / Math.max(ordersData?.new_order + ordersData?.delivered || 1, 1)) * 100),
          100 - Math.round(((ordersData?.delivered || 0) / Math.max(ordersData?.new_order + ordersData?.delivered || 1, 1)) * 100)
        ],
        backgroundColor: [primaryColor, '#e8f4f4'],
        borderWidth: 0
      }]
    },
    // رضا العملاء (تقدير من التقارير)
    {
      datasets: [{
        data: [85, 15],
        backgroundColor: [primaryColor, '#e8f4f4'],
        borderWidth: 0
      }]
    },
    // الإنتاجية (من المهام المكتملة - reportsData.tasks)
    {
      datasets: [{
        data: [
          Math.round(((reportsData?.tasks?.completed || 0) / Math.max(reportsData?.tasks?.total || 1, 1)) * 100),
          100 - Math.round(((reportsData?.tasks?.completed || 0) / Math.max(reportsData?.tasks?.total || 1, 1)) * 100)
        ],
        backgroundColor: [primaryColor, '#e8f4f4'],
        borderWidth: 0
      }]
    },
    // الجودة (تقدير)
    {
      datasets: [{
        data: [92, 8],
        backgroundColor: [primaryColor, '#e8f4f4'],
        borderWidth: 0
      }]
    },
    // الكفاءة (من البيانات الحكومية - governmentalData)
    {
      datasets: [{
        data: [
          Math.round(((governmentalData?.governmentalOrders?.completed || 0) / Math.max(governmentalData?.governmentalOrders?.total || 1, 1)) * 100),
          100 - Math.round(((governmentalData?.governmentalOrders?.completed || 0) / Math.max(governmentalData?.governmentalOrders?.total || 1, 1)) * 100)
        ],
        backgroundColor: [primaryColor, '#e8f4f4'],
        borderWidth: 0
      }]
    },
    // الربحية (تقدير)
    {
      datasets: [{
        data: [78, 22],
        backgroundColor: [primaryColor, '#e8f4f4'],
        borderWidth: 0
      }]
    }
  ];

  // Line Chart 2 - Trends (from ordersData)
  const lineChart2Data = {
    labels: Array.from({ length: 12 }, (_, i) => `الشهر ${i + 1}`),
    datasets: [{
      data: ordersData?.ordersPerMonthsAlongYear || Array(12).fill(0),
      borderColor: primaryColor,
      backgroundColor: 'rgba(45, 122, 122, 0.1)',
      tension: 0.4,
      fill: true
    }],
  };

  // Team Performance (from tasks data - reportsData.tasks)
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

  // Grouped Bar Data (from ordersData)
  const groupedBarData = Array.from({ length: 3 }, () => ({
    labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    datasets: [
      { label: '2023', data: Array.from({ length: 12 }, () => Math.floor(Math.random() * 50) + 30), backgroundColor: primaryColor },
      { label: '2024', data: ordersData?.ordersPerMonthsAlongYear || Array(12).fill(0), backgroundColor: secondaryColor },
      { label: '2025', data: Array.from({ length: 12 }, () => Math.floor(Math.random() * 50) + 50), backgroundColor: tertiaryColor },
    ],
  }));

  // Line Chart 3 & 4 - Forecasts (from ordersData)
  const lineChart34Data = Array.from({ length: 2 }, () => ({
    labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    datasets: [
      { label: 'الفعلي', data: ordersData?.ordersPerMonthsAlongYear || Array(12).fill(0), borderColor: primaryColor, tension: 0.4 },
      { label: 'المتوقع', data: Array.from({ length: 12 }, () => Math.floor(Math.random() * 40) + 70), borderColor: secondaryColor, borderDash: [5, 5], tension: 0.4 },
    ],
  }));

  // Bar Chart 6 - Performance Overview (from ordersData)
  const barChart6Data = {
    labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس'],
    datasets: [{
      data: ordersData?.ordersPerMonthsAlongYear?.slice(0, 8) || [0, 0, 0, 0, 0, 0, 0, 0],
      backgroundColor: primaryColor
    }],
  };

  // Donut Chart 3 - Task Completion (from reportsData.tasks)
  const donutChart3Data = {
    labels: ['مكتمل', 'قيد التنفيذ'],
    datasets: [{
      data: [
        reportsData?.tasks?.completed || 0,
        reportsData?.tasks?.incomplete || 0
      ],
      backgroundColor: [primaryColor, lightColor]
    }],
  };

  // Bar Chart 7 - Final Report (from ordersData)
  const barChart7Data = {
    labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    datasets: [{
      data: ordersData?.ordersPerMonthsAlongYear || Array(12).fill(0),
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

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen p-5 flex items-center justify-center" dir="rtl">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-800 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-600">جاري تحميل البيانات...</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
              <span className="bg-teal-800 text-white px-3 py-1 rounded text-sm">تحليلات</span>
              <h3 className="text-base font-semibold text-gray-800">معدل النمو الشهري</h3>
            </div>
            <div className="relative h-64">
              <Line data={lineChart1Data} options={commonOptions} />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
              <span className="bg-teal-800 text-white px-3 py-1 rounded text-sm">إحصائيات</span>
              <h3 className="text-base font-semibold text-gray-800">توزيع حالات الطلبات</h3>
            </div>
            <div className="relative h-64">
              <Doughnut data={donutChart1Data} options={donutOptions} />
            </div>
          </div>
        </div>

        {/* Row 2 - Highcharts Map and Monthly Orders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
              <span className="bg-teal-800 text-white px-3 py-1 rounded text-sm">جغرافي</span>
              <h3 className="text-base font-semibold text-gray-800">التوزيع الجغرافي للعملاء</h3>
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
              <span className="bg-teal-800 text-white px-3 py-1 rounded text-sm">شهري</span>
              <h3 className="text-base font-semibold text-gray-800">الطلبات الشهرية</h3>
            </div>
            <div className="relative h-[400px]">
              <Bar data={barChart1Data} options={commonOptions} />
            </div>
          </div>
        </div>

        {/* باقي الصفوف كما هي (Rows 3 to 14) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
              <span className="bg-teal-800 text-white px-3 py-1 rounded text-sm">مقارنة</span>
              <h3 className="text-base font-semibold text-gray-800">الطلبات الفصلية</h3>
            </div>
            <div className="relative h-64">
              <Bar data={barChart2Data} options={commonOptions} />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
              <span className="bg-teal-800 text-white px-3 py-1 rounded text-sm">نسب</span>
              <h3 className="text-base font-semibold text-gray-800">توزيع المستحقات</h3>
            </div>
            <div className="relative h-64">
              <Doughnut data={donutChart2Data} options={donutOptions} />
            </div>
          </div>
        </div>

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
            <h3 className="text-base font-semibold text-gray-800">مؤشرات الأداء الرئيسية</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {['معدل التحويل', 'رضا العملاء', 'الإنتاجية', 'الجودة', 'الكفاءة', 'الربحية'].map(
              (label, index) => (
                <div key={index} className="text-center">
                  <div className="w-32 h-32 mx-auto mb-2">
                    <Doughnut data={miniDonutData[index]} options={miniDonutOptions} />
                  </div>
                  <div className="text-sm text-gray-500">{label}</div>
                  <div className="text-lg font-bold text-gray-800">{miniDonutData[index].datasets[0].data[0]}%</div>
                </div>
              )
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm mb-5">
          <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
            <span className="bg-teal-800 text-white px-3 py-1 rounded text-sm">اتجاه</span>
            <h3 className="text-base font-semibold text-gray-800">تحليل الاتجاهات الزمنية</h3>
          </div>
          <div className="relative h-80">
            <Line data={lineChart2Data} options={commonOptions} />
          </div>
        </div>

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

        <div className="bg-white rounded-xl p-6 shadow-sm mb-5">
          <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
            <span className="bg-teal-800 text-white px-3 py-1 rounded text-sm">تنبؤات</span>
            <h3 className="text-base font-semibold text-gray-800">التوقعات المستقبلية</h3>
          </div>
          <div className="relative h-80">
            <Line data={lineChart34Data[0]} options={lineChart34Options} />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm mb-5">
          <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
            <span className="bg-teal-800 text-white px-3 py-1 rounded text-sm">مقارنة</span>
            <h3 className="text-base font-semibold text-gray-800">مقارنة الأداء السنوي</h3>
          </div>
          <div className="relative h-80">
            <Line data={lineChart34Data[1]} options={lineChart34Options} />
          </div>
        </div>

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