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

  // Mock data
  const mockCitiesData = [
    { city: 'Ar Riyāḍ', _count: { id: 100 } },
    { city: 'Makkah al Mukarramah', _count: { id: 80 } },
    { city: 'Al Madīnah al Munawwarah', _count: { id: 60 } },
    { city: 'Ash Sharqīyah', _count: { id: 50 } },
    { city: '‘Asīr', _count: { id: 40 } },
    { city: 'Tabūk', _count: { id: 30 } },
    { city: 'Al Ḩudūd ash Shamālīyah', _count: { id: 20 } },
    { city: 'Jazan', _count: { id: 25 } },
    { city: 'Najrān', _count: { id: 15 } },
    { city: 'Al Bāḩah', _count: { id: 10 } },
    { city: 'Al Jawf', _count: { id: 12 } },
    { city: 'Al Qaşīm', _count: { id: 18 } },
    { city: 'Ḩa\'il', _count: { id: 22 } }
  ];

  const [citiesData] = useState(mockCitiesData);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapTopology, setMapTopology] = useState<any>(null);
  const [Highcharts, setHighcharts] = useState<any>(null);
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

  // Prepare map data
  const mapData = citiesData
    .map((item) => {
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
    .filter(Boolean);

  // Load Highcharts + map module + topology (using the same logic from reports.tsx)
useEffect(() => {
  if (typeof window === 'undefined') return;

  const initMap = async () => {
    try {
      // دالة لتحميل Highcharts ديناميكيًا (نفس المنطق من reports.tsx)
      const loadHighcharts = async () => {
        if (typeof window === 'undefined') return;

        // إذا لم يُحمّل Highcharts بعد
        if (!window.Highcharts) {
          await new Promise<void>((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://code.highcharts.com/maps/highmaps.js';
            script.onload = () => {
              // تحميل وحدة exporting اختياري
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

        // الآن Highcharts جاهز
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

        const data = citiesData
          .map((item: any) => {
            const eng = item.city;
            const hcKey = regionMap[eng as keyof typeof regionMap];
            const name = arabicRegionMap[eng as keyof typeof arabicRegionMap];
            const value = item._count?.id || 0;
            if (!hcKey || !name) return null;
            return { hcKey, name, value };
          })
          .filter(Boolean) as { hcKey: string; name: string; value: number }[];

        if (data.length === 0) {
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
              minColor: '#14B8A6',   // لون المناطق ذات القيمة القليلة (أو صفر)
              maxColor: '#134E4A',//teal-800   // لون المناطق ذات القيمة العالية
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
               data,
              joinBy: ['hc-key', 'hcKey'],
              name: 'عدد العملاء',
              nullColor: '#14B8A6', // رمادي فاتح للمناطق بدون بيانات
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
}, []);

  // =============== Chart Data (unchanged) ===============
  const lineChart1Data = {
    labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
    datasets: [{ data: [65, 70, 68, 75, 72, 80], borderColor: primaryColor, backgroundColor: 'rgba(45, 122, 122, 0.1)', tension: 0.4, fill: true }],
  };

  const donutChart1Data = {
    labels: ['18-25', '26-35', '36-45', '46+'],
    datasets: [{ data: [30, 35, 20, 15], backgroundColor: ["#600000", "#F8DADA", "lightblue", tertiaryColor] }],
  };

  const barChart1Data = {
    labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
    datasets: [{ data: [120, 150, 130, 180, 160, 200], backgroundColor: primaryColor }],
  };

  const barChart2Data = {
    labels: ['الربع 1', 'الربع 2', 'الربع 3', 'الربع 4'],
    datasets: [{ data: [450, 520, 480, 590], backgroundColor: primaryColor }],
  };

  const donutChart2Data = {
    labels: ['المنتج أ', 'المنتج ب', 'المنتج ج'],
    datasets: [{ data: [45, 30, 25], backgroundColor: [primaryColor, secondaryColor, tertiaryColor] }],
  };

  const barChart3Data = {
    labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    datasets: [{ data: [450, 520, 380, 490, 560, 430, 510, 480, 520, 470, 540, 590], backgroundColor: primaryColor }],
  };

  const miniDonutData = [67, 89, 74, 92, 81, 78].map((value) => ({
    datasets: [{ data: [value, 100 - value], backgroundColor: [primaryColor, '#e8f4f4'], borderWidth: 0 }],
  }));

  const lineChart2Data = {
    labels: Array.from({ length: 12 }, (_, i) => `الشهر ${i + 1}`),
    datasets: [{ data: [120, 135, 128, 145, 152, 148, 165, 172, 168, 185, 192, 198], borderColor: primaryColor, backgroundColor: 'rgba(45, 122, 122, 0.1)', tension: 0.4, fill: true }],
  };

  const teamData = [85, 92, 78, 88, 95, 82];
  const barChart4Data = {
    labels: ['الفريق 1', 'الفريق 2', 'الفريق 3', 'الفريق 4', 'الفريق 5', 'الفريق 6'],
    datasets: [{ data: teamData.map((v) => v + Math.random() * 10 - 5), backgroundColor: primaryColor }],
  };

  const barChart5Data = {
    labels: ['الفريق 1', 'الفريق 2', 'الفريق 3', 'الفريق 4', 'الفريق 5', 'الفريق 6'],
    datasets: [{ data: teamData.map((v) => v + Math.random() * 10 - 5), backgroundColor: primaryColor }],
  };

  const groupedBarData = Array.from({ length: 3 }, () => ({
    labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    datasets: [
      { label: '2023', data: Array.from({ length: 12 }, () => Math.floor(Math.random() * 50) + 30), backgroundColor: primaryColor },
      { label: '2024', data: Array.from({ length: 12 }, () => Math.floor(Math.random() * 50) + 40), backgroundColor: secondaryColor },
      { label: '2025', data: Array.from({ length: 12 }, () => Math.floor(Math.random() * 50) + 50), backgroundColor: tertiaryColor },
    ],
  }));

  const lineChart34Data = Array.from({ length: 2 }, () => ({
    labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    datasets: [
      { label: 'الفعلي', data: Array.from({ length: 12 }, () => Math.floor(Math.random() * 40) + 60), borderColor: primaryColor, tension: 0.4 },
      { label: 'المتوقع', data: Array.from({ length: 12 }, () => Math.floor(Math.random() * 40) + 70), borderColor: secondaryColor, borderDash: [5, 5], tension: 0.4 },
    ],
  }));

  const barChart6Data = {
    labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس'],
    datasets: [{ data: [45, 52, 38, 49, 56, 43, 51, 48], backgroundColor: primaryColor }],
  };

  const donutChart3Data = {
    labels: ['مكتمل', 'قيد التنفيذ'],
    datasets: [{ data: [73, 27], backgroundColor: [primaryColor, lightColor] }],
  };

  const barChart7Data = {
    labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    datasets: [{ data: [320, 380, 340, 410, 450, 390, 430, 460, 420, 480, 510, 540], backgroundColor: primaryColor }],
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
        {/* تأكد من عدم وجود مسافات في الروابط */}
        <script src="https://code.highcharts.com/maps/highmaps.js"></script>
        <script src="https://code.highcharts.com/maps/modules/exporting.js"></script>
      </Head>

      <style jsx global>{`
        body {
          font-family: 'Tajawal', sans-serif;
        }
        #map-container {
          height: 500px;
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
              <h3 className="text-base font-semibold text-gray-800">توزيع الفئات العمرية</h3>
            </div>
            <div className="relative h-64">
              <Doughnut data={donutChart1Data} options={donutOptions} />
            </div>
          </div>
        </div>

        {/* Row 2 - Highcharts Map */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
              <span className="bg-teal-800 text-white px-3 py-1 rounded text-sm">جغرافي</span>
              <h3 className="text-base font-semibold text-gray-800">التوزيع الجغرافي للمبيعات</h3>
            </div>
            <p className="text-gray-600 text-sm mb-5">
              خريطة تفاعلية بسيطة للمملكة العربية السعودية توضح عدد العملاء حسب المنطقة. الألوان تشير إلى كثافة العملاء.
            </p>
            {mapLoaded ? (
              <div id=""></div>
            ) : (
              <div className="loading">جاري تحميل الخريطة...</div>
            )}
          </div>
          <div className="bg-white rounded-xl p-6  shadow-sm">
            <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
              <span className="bg-teal-800 text-white px-3 py-1 rounded text-sm">شهري</span>
              <h3 className="text-base font-semibold text-gray-800">الإيرادات الشهرية</h3>
            </div>
            <div className="relative h-64">
              <Bar data={barChart1Data} options={commonOptions} />
            </div>
          </div>
        </div>

        {/* باقي الصفوف كما هي (Rows 3 to 14) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
              <span className="bg-teal-800 text-white px-3 py-1 rounded text-sm">مقارنة</span>
              <h3 className="text-base font-semibold text-gray-800">المبيعات الفصلية</h3>
            </div>
            <div className="relative h-64">
              <Bar data={barChart2Data} options={commonOptions} />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
              <span className="bg-teal-800 text-white px-3 py-1 rounded text-sm">نسب</span>
              <h3 className="text-base font-semibold text-gray-800">حصة السوق</h3>
            </div>
            <div className="relative h-64">
              <Doughnut data={donutChart2Data} options={donutOptions} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm mb-5">
          <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
            <span className="bg-teal-800 text-white px-3 py-1 rounded text-sm">تحليل سنوي</span>
            <h3 className="text-base font-semibold text-gray-800">أداء المنتجات حسب الشهر</h3>
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