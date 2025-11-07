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
import { useRouter } from 'next/router';

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
  const router = useRouter();
  
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
  const [employeePerformanceData, setEmployeePerformanceData] = useState<any>(null);
  const [officesFinancialData, setOfficesFinancialData] = useState<any>(null);
  const [employeeCashStatsData, setEmployeeCashStatsData] = useState<any>(null);
  const [clientAccountsStatsData, setClientAccountsStatsData] = useState<any>(null);
  const [incomeStatementStatsData, setIncomeStatementStatsData] = useState<any>(null);
  const [musanadFinancialStatsData, setMusanadFinancialStatsData] = useState<any>(null);
  const [settlementStatsData, setSettlementStatsData] = useState<any>(null);
  const [taxMonthlyStatsData, setTaxMonthlyStatsData] = useState<any>(null);
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

  const [employeePerformancePeriod, setEmployeePerformancePeriod] = useState<string>('year');
  const [employeePerformanceStartDate, setEmployeePerformanceStartDate] = useState<string>('');
  const [employeePerformanceEndDate, setEmployeePerformanceEndDate] = useState<string>('');

  const [bookedEmployeesByOfficePeriod, setBookedEmployeesByOfficePeriod] = useState<string>('year');
  const [bookedEmployeesByOfficeStartDate, setBookedEmployeesByOfficeStartDate] = useState<string>('');
  const [bookedEmployeesByOfficeEndDate, setBookedEmployeesByOfficeEndDate] = useState<string>('');
  const [bookedEmployeesByOfficeData, setBookedEmployeesByOfficeData] = useState<any>(null);

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

  // Handler for city clicks - navigate to clients page with city filter
  const handleCityClick = (cityName: string) => {
    // Convert Arabic city name to English if needed
    const englishCityName = Object.entries(arabicRegionMap).find(
      ([_, arabic]) => arabic === cityName
    )?.[0] || cityName;
    router.push(`/admin/clients?city=${encodeURIComponent(englishCityName)}`);
  };

  // Handler for source clicks - navigate to clients page (we'll need to check if source filter is supported)
  const handleSourceClick = (source: string) => {
    // Navigate to clients page - you may need to add source filter support
    router.push(`/admin/clients?source=${encodeURIComponent(source)}`);
  };

  // Handler for nationality clicks - navigate to bookedlist with nationality filter
  const handleNationalityClick = (nationality: string) => {
    router.push(`/admin/bookedlist?Nationality=${encodeURIComponent(nationality)}`);
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

  const fetchBookedEmployeesByOfficeData = async () => {
    try {
      const url = bookedEmployeesByOfficePeriod === 'custom'
        ? `/api/reports/booked-employees-by-office`
        : `/api/reports/booked-employees-by-office?period=${bookedEmployeesByOfficePeriod}`;
      
      const response = await fetch(url, {
        method: bookedEmployeesByOfficePeriod === 'custom' ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: bookedEmployeesByOfficePeriod === 'custom' ? JSON.stringify({ period: bookedEmployeesByOfficePeriod, startDate: bookedEmployeesByOfficeStartDate, endDate: bookedEmployeesByOfficeEndDate }) : undefined,
      });
      const data = await response.json();
      setBookedEmployeesByOfficeData(data);
    } catch (error) {
      console.error('Error fetching booked employees by office data:', error);
    }
  };

  const fetchEmployeePerformanceData = async () => {
    try {
      const url = employeePerformancePeriod === 'custom'
        ? `/api/reports/employee-performance`
        : `/api/reports/employee-performance?period=${employeePerformancePeriod}`;
      
      const response = await fetch(url, {
        method: employeePerformancePeriod === 'custom' ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: employeePerformancePeriod === 'custom' ? JSON.stringify({ period: employeePerformancePeriod, startDate: employeePerformanceStartDate, endDate: employeePerformanceEndDate }) : undefined,
      });
      const data = await response.json();
      setEmployeePerformanceData(data);
    } catch (error) {
      console.error('Error fetching employee performance data:', error);
    }
  };

  const fetchOfficesFinancialData = async () => {
    try {
      const response = await fetch('/api/reports/offices-financial');
      const data = await response.json();
      setOfficesFinancialData(data);
    } catch (error) {
      console.error('Error fetching offices financial data:', error);
    }
  };

  const fetchEmployeeCashStatsData = async () => {
    try {
      const response = await fetch('/api/reports/employee-cash-stats');
      const data = await response.json();
      setEmployeeCashStatsData(data);
    } catch (error) {
      console.error('Error fetching employee cash stats data:', error);
    }
  };

  const fetchClientAccountsStatsData = async () => {
    try {
      const response = await fetch('/api/reports/client-accounts-stats');
      const data = await response.json();
      setClientAccountsStatsData(data);
    } catch (error) {
      console.error('Error fetching client accounts stats data:', error);
    }
  };

  const fetchIncomeStatementStatsData = async () => {
    try {
      const response = await fetch('/api/reports/income-statement-stats?zakatRate=2.5');
      const data = await response.json();
      setIncomeStatementStatsData(data);
    } catch (error) {
      console.error('Error fetching income statement stats data:', error);
    }
  };

  const fetchMusanadFinancialStatsData = async () => {
    try {
      const response = await fetch('/api/reports/musanad-financial-stats');
      const data = await response.json();
      setMusanadFinancialStatsData(data);
    } catch (error) {
      console.error('Error fetching musanad financial stats data:', error);
    }
  };

  const fetchSettlementStatsData = async () => {
    try {
      const response = await fetch('/api/reports/settlement-stats');
      const data = await response.json();
      setSettlementStatsData(data);
    } catch (error) {
      console.error('Error fetching settlement stats data:', error);
    }
  };

  const fetchTaxMonthlyStatsData = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const response = await fetch(`/api/tax/monthly-stats?year=${currentYear}`);
      const data = await response.json();
      setTaxMonthlyStatsData(data);
    } catch (error) {
      console.error('Error fetching tax monthly stats data:', error);
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
    fetchBookedEmployeesByOfficeData();
    fetchEmployeePerformanceData();
    fetchOfficesFinancialData();
    fetchEmployeeCashStatsData();
    fetchClientAccountsStatsData();
    fetchIncomeStatementStatsData();
    fetchMusanadFinancialStatsData();
    fetchSettlementStatsData();
    fetchTaxMonthlyStatsData();
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
  }, [ordersPeriod, ordersStartDate, ordersEndDate, growthPeriod, growthStartDate, growthEndDate, tasksPeriod, tasksStartDate, tasksEndDate, bookedEmployeesByOfficePeriod, bookedEmployeesByOfficeStartDate, bookedEmployeesByOfficeEndDate, employeePerformancePeriod, employeePerformanceStartDate, employeePerformanceEndDate]);

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
            plotOptions: {
              map: {
                cursor: 'pointer',
                events: {
                  click: function(e: any) {
                    const hcKey = e.point['hc-key'];
                    const englishName = hcKeyToEnglishMap[hcKey];
                    const arabicName = englishName ? arabicRegionMap[englishName] : (e.point.name || '');
                    if (englishName) {
                      // Navigate to clients page with city filter
                      const englishCityName = englishName;
                      window.location.href = `/admin/clients?city=${encodeURIComponent(englishCityName)}`;
                    }
                  }
                }
              }
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

  // Chart Data for Booked Employees by Office
  const bookedEmployeesByOfficeBarChartData = {
    labels: bookedEmployeesByOfficeData?.map((item: any) => item.office) || [],
    datasets: [{
      label: 'عدد العاملات المحجوزة',
      data: bookedEmployeesByOfficeData?.map((item: any) => item.count) || [],
      backgroundColor: secondaryColor,
      borderColor: secondaryColor,
      borderWidth: 1,
    }],
  };

  const bookedEmployeesByOfficeBarChartOptions = {
    responsive: true,
    scales: {
      y: { 
        beginAtZero: true, 
        title: { display: true, text: 'عدد العاملات المحجوزة', font: { family: '"Tajawal", sans-serif', size: 14 } },
        ticks: {
          stepSize: 1,
          precision: 0,
        }
      },
      x: { 
        grid: { display: false }, 
        title: { display: true, text: 'المكتب', font: { family: '"Tajawal", sans-serif', size: 14 } } 
      },
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
            const item = bookedEmployeesByOfficeData[index];
            return `عدد العاملات المحجوزة: ${item?.count || 0}`;
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

  const bookedEmployeesByOfficeTableData = bookedEmployeesByOfficeData?.map((item: any) => ({
    المكتب: item.office || 'غير محدد',
    'عدد العاملات المحجوزة': item.count || 0,
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
          canvas {
            cursor: pointer;
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
                  onHover: (event, elements) => {
                    const target = event.native?.target as HTMLElement;
                    if (target) {
                      target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
                    }
                  },
                  onClick: (event, elements) => {
                    if (elements.length > 0) {
                      const element = elements[0];
                      const index = element.index;
                      const source = donutChart4Data.labels[index];
                      if (source) {
                        handleSourceClick(source);
                      }
                    }
                  },
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
                          onHover: (event, elements) => {
                            if (elements.length > 0) {
                              (event.native?.target as HTMLElement)?.style && ((event.native?.target as HTMLElement).style.cursor = 'pointer');
                            }
                          },
                          onClick: (event, elements) => {
                            if (elements.length > 0) {
                              const element = elements[0];
                              const index = element.index;
                              const nationality = item.chartData.labels[index];
                              if (nationality) {
                                handleNationalityClick(nationality);
                              }
                            }
                          },
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

          {/* Row 6.5: إحصائيات العاملات المحجوزة حسب المكتب */}
          <div className="bg-white rounded-xl p-6 shadow-sm mb-5">
            <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
              <div className="flex items-center gap-4">
                <select
                  value={bookedEmployeesByOfficePeriod}
                  onChange={(e) => setBookedEmployeesByOfficePeriod(e.target.value)}
                  className="bg-white text-black py-1 rounded text-sm"
                >
                  <option value="week">أسبوعي</option>
                  <option value="month">شهري</option>
                  <option value="year">سنوي</option>
                  <option value="custom">مخصص</option>
                </select>
                {bookedEmployeesByOfficePeriod === 'custom' && (
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={bookedEmployeesByOfficeStartDate}
                      onChange={(e) => setBookedEmployeesByOfficeStartDate(e.target.value)}
                      className="border rounded px-2 py-1"
                    />
                    <input
                      type="date"
                      value={bookedEmployeesByOfficeEndDate}
                      onChange={(e) => setBookedEmployeesByOfficeEndDate(e.target.value)}
                      className="border rounded px-2 py-1"
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                <h3 className="text-base font-semibold text-gray-800">عدد العاملات المحجوزة لكل مكتب</h3>
                <button
                  onClick={() => openModal('عدد العاملات المحجوزة لكل مكتب', ['المكتب', 'عدد العاملات المحجوزة'], bookedEmployeesByOfficeTableData)}
                  className="bg-teal-700 text-white px-4 py-2 rounded text-sm hover:bg-teal-800"
                >
                  عرض الجدول
                </button>
              </div>
            </div>
            <div className="relative h-64">
              {bookedEmployeesByOfficeData?.length > 0 ? (
                <Bar data={bookedEmployeesByOfficeBarChartData} options={bookedEmployeesByOfficeBarChartOptions} />
              ) : (
                <div className="text-center text-gray-500">لا توجد بيانات متاحة.</div>
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

          {/* Row 8: أداء الموظفين */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            {/* النصف الأول: إحصائيات المهام */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
                <div className="flex items-center gap-4">
                  <select
                    value={employeePerformancePeriod}
                    onChange={(e) => setEmployeePerformancePeriod(e.target.value)}
                    className="bg-white text-black py-1 rounded text-sm"
                  >
                    <option value="week">أسبوعي</option>
                    <option value="month">شهري</option>
                    <option value="year">سنوي</option>
                    <option value="custom">مخصص</option>
                  </select>
                  {employeePerformancePeriod === 'custom' && (
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={employeePerformanceStartDate}
                        onChange={(e) => setEmployeePerformanceStartDate(e.target.value)}
                        className="border rounded px-2 py-1"
                      />
                      <input
                        type="date"
                        value={employeePerformanceEndDate}
                        onChange={(e) => setEmployeePerformanceEndDate(e.target.value)}
                        className="border rounded px-2 py-1"
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <h3 className="text-base font-semibold text-gray-800">إحصائيات المهام لكل موظف</h3>
                  {employeePerformanceData?.employees && employeePerformanceData.employees.length > 0 && (
                    <button
                      onClick={() => {
                        const tableData = employeePerformanceData.employees.map((emp: any) => ({
                          الموظف: emp.employeeName,
                          'مكتملة': emp.tasks.completed,
                          'معلقة': emp.tasks.pending,
                          'إجمالي': emp.tasks.total,
                          'أنشأها': emp.tasks.created,
                        }));
                        openModal('إحصائيات المهام لكل موظف', ['الموظف', 'مكتملة', 'معلقة', 'إجمالي', 'أنشأها'], tableData);
                      }}
                      className="bg-teal-700 text-white px-4 py-2 rounded text-sm hover:bg-teal-800"
                    >
                      عرض الجدول
                    </button>
                  )}
                </div>
              </div>
              <div className="relative h-64">
                {employeePerformanceData?.employees && employeePerformanceData.employees.length > 0 ? (
                  <Bar 
                    data={{
                      labels: employeePerformanceData.employees.map((emp: any) => emp.employeeName),
                      datasets: [
                        {
                          label: 'مكتملة',
                          data: employeePerformanceData.employees.map((emp: any) => emp.tasks.completed),
                          backgroundColor: primaryColor,
                          borderColor: primaryColor,
                          borderWidth: 1,
                        },
                        {
                          label: 'معلقة',
                          data: employeePerformanceData.employees.map((emp: any) => emp.tasks.pending),
                          backgroundColor: secondaryColor,
                          borderColor: secondaryColor,
                          borderWidth: 1,
                        },
                      ],
                    }} 
                    options={{
                      ...commonOptions,
                      plugins: {
                        ...commonOptions.plugins,
                        legend: {
                          display: true,
                          position: 'top' as const,
                          labels: {
                            font: { family: '"Tajawal", sans-serif', size: 14 }
                          }
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
                            font: { family: '"Tajawal", sans-serif', size: 14 }
                          }
                        },
                        x: {
                          grid: { display: false },
                          title: {
                            display: true,
                            text: 'الموظف',
                            font: { family: '"Tajawal", sans-serif', size: 14 }
                          }
                        },
                      },
                    }} 
                  />
                ) : (
                  <div className="text-center text-gray-500 py-16">لا توجد بيانات موظفين متاحة</div>
                )}
              </div>
            </div>

            {/* النصف الثاني: إحصائيات الطلبات */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
                <span className="bg-teal-800 text-white px-3 py-1 rounded text-sm">طلبات</span>
                <div className="flex items-center gap-4">
                  <h3 className="text-base font-semibold text-gray-800">إحصائيات الطلبات لكل موظف</h3>
                  {employeePerformanceData?.employees && employeePerformanceData.employees.length > 0 && (
                    <button
                      onClick={() => {
                        const tableData = employeePerformanceData.employees.map((emp: any) => ({
                          الموظف: emp.employeeName,
                          'جديد': emp.orders.byStatus.new,
                          'قيد التنفيذ': emp.orders.byStatus.inProgress,
                          'مكتمل': emp.orders.byStatus.delivered,
                          'ملغي': emp.orders.byStatus.cancelled,
                          'إجمالي': emp.orders.total,
                        }));
                        openModal('إحصائيات الطلبات لكل موظف', ['الموظف', 'جديد', 'قيد التنفيذ', 'مكتمل', 'ملغي', 'إجمالي'], tableData);
                      }}
                      className="bg-teal-700 text-white px-4 py-2 rounded text-sm hover:bg-teal-800"
                    >
                      عرض الجدول
                    </button>
                  )}
                </div>
              </div>
              <div className="relative h-64">
                {employeePerformanceData?.employees && employeePerformanceData.employees.length > 0 ? (
                  <Bar 
                    data={{
                      labels: employeePerformanceData.employees.map((emp: any) => emp.employeeName),
                      datasets: [
                        {
                          label: 'جديد',
                          data: employeePerformanceData.employees.map((emp: any) => emp.orders.byStatus.new),
                          backgroundColor: '#600000',
                          borderColor: '#600000',
                          borderWidth: 1,
                        },
                        {
                          label: 'قيد التنفيذ',
                          data: employeePerformanceData.employees.map((emp: any) => emp.orders.byStatus.inProgress),
                          backgroundColor: '#F8DADA',
                          borderColor: '#F8DADA',
                          borderWidth: 1,
                        },
                        {
                          label: 'مكتمل',
                          data: employeePerformanceData.employees.map((emp: any) => emp.orders.byStatus.delivered),
                          backgroundColor: primaryColor,
                          borderColor: primaryColor,
                          borderWidth: 1,
                        },
                        {
                          label: 'ملغي',
                          data: employeePerformanceData.employees.map((emp: any) => emp.orders.byStatus.cancelled),
                          backgroundColor: tertiaryColor,
                          borderColor: tertiaryColor,
                          borderWidth: 1,
                        },
                      ],
                    }} 
                    options={{
                      ...commonOptions,
                      plugins: {
                        ...commonOptions.plugins,
                        legend: {
                          display: true,
                          position: 'top' as const,
                          labels: {
                            font: { family: '"Tajawal", sans-serif', size: 14 }
                          }
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
                            text: 'عدد الطلبات',
                            font: { family: '"Tajawal", sans-serif', size: 14 }
                          }
                        },
                        x: {
                          grid: { display: false },
                          title: {
                            display: true,
                            text: 'الموظف',
                            font: { family: '"Tajawal", sans-serif', size: 14 }
                          }
                        },
                      },
                    }} 
                  />
                ) : (
                  <div className="text-center text-gray-500 py-16">لا توجد بيانات طلبات متاحة</div>
                )}
              </div>
            </div>
          </div>

          {/* Row 8.5: إحصائية المكاتب */}
          <div className="bg-white rounded-xl p-6 shadow-sm mb-5">
            <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
              <span className="bg-teal-800 text-white px-3 py-1 rounded text-sm">مكاتب</span>
              <div className="flex items-center gap-4">
                <h3 className="text-base font-semibold text-gray-800">إحصائية المكاتب - الدائن والمدين والرصيد</h3>
                {officesFinancialData?.aggregatedByMonth && officesFinancialData.aggregatedByMonth.length > 0 && (
                  <button
                    onClick={() => {
                      const tableData = officesFinancialData.aggregatedByMonth.map((month: any) => ({
                        الشهر: month.month,
                        'الدائن': month.credit.toFixed(2),
                        'المدين': month.debit.toFixed(2),
                        'الرصيد': month.balance.toFixed(2),
                      }));
                      openModal('إحصائية المكاتب', ['الشهر', 'الدائن', 'المدين', 'الرصيد'], tableData);
                    }}
                    className="bg-teal-700 text-white px-4 py-2 rounded text-sm hover:bg-teal-800"
                  >
                    عرض الجدول
                  </button>
                )}
              </div>
            </div>
            <div className="relative h-80">
              {officesFinancialData?.aggregatedByMonth && officesFinancialData.aggregatedByMonth.length > 0 ? (
                <Bar 
                  data={{
                    labels: officesFinancialData.aggregatedByMonth.map((month: any) => month.month),
                    datasets: [
                      {
                        label: 'الدائن',
                        data: officesFinancialData.aggregatedByMonth.map((month: any) => month.credit),
                        backgroundColor: primaryColor,
                        borderColor: primaryColor,
                        borderWidth: 1,
                      },
                      {
                        label: 'المدين',
                        data: officesFinancialData.aggregatedByMonth.map((month: any) => month.debit),
                        backgroundColor: secondaryColor,
                        borderColor: secondaryColor,
                        borderWidth: 1,
                      },
                      {
                        label: 'الرصيد',
                        data: officesFinancialData.aggregatedByMonth.map((month: any) => month.balance),
                        backgroundColor: tertiaryColor,
                        borderColor: tertiaryColor,
                        borderWidth: 1,
                      },
                    ],
                  }} 
                  options={{
                    ...commonOptions,
                    plugins: {
                      ...commonOptions.plugins,
                      legend: {
                        display: true,
                        position: 'top' as const,
                        labels: {
                          font: { family: '"Tajawal", sans-serif', size: 14 }
                        }
                      },
                      tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: { family: '"Tajawal", sans-serif' },
                        bodyFont: { family: '"Tajawal", sans-serif' },
                        callbacks: {
                          label: (context: any) => {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y;
                            return `${label}: ${value.toLocaleString()}`;
                          },
                        },
                      },
                    },
                    scales: {
                      y: { 
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'المبلغ',
                          font: { family: '"Tajawal", sans-serif', size: 14 }
                        },
                        ticks: {
                          callback: function(value: any) {
                            return value.toLocaleString();
                          }
                        }
                      },
                      x: {
                        grid: { display: false },
                        title: {
                          display: true,
                          text: 'الشهر',
                          font: { family: '"Tajawal", sans-serif', size: 14 }
                        }
                      },
                    },
                  }} 
                />
              ) : (
                <div className="text-center text-gray-500 py-32">لا توجد بيانات مكاتب متاحة</div>
              )}
            </div>
          </div>

          {/* Row 8.6: إحصائية العهد */}
          <div className="bg-white rounded-xl p-6 shadow-sm mb-5">
            <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
              <span className="bg-teal-800 text-white px-3 py-1 rounded text-sm">عهد</span>
              <div className="flex items-center gap-4">
                <h3 className="text-base font-semibold text-gray-800">إحصائية العهد - المدين والدائن والرصيد</h3>
                {employeeCashStatsData?.monthlyData && employeeCashStatsData.monthlyData.length > 0 && (
                  <button
                    onClick={() => {
                      const tableData = employeeCashStatsData.monthlyData.map((month: any) => ({
                        الشهر: month.month,
                        'المدين': month.debit.toFixed(2),
                        'الدائن': month.credit.toFixed(2),
                        'الرصيد': month.balance.toFixed(2),
                      }));
                      openModal('إحصائية العهد', ['الشهر', 'المدين', 'الدائن', 'الرصيد'], tableData);
                    }}
                    className="bg-teal-700 text-white px-4 py-2 rounded text-sm hover:bg-teal-800"
                  >
                    عرض الجدول
                  </button>
                )}
              </div>
            </div>
            <div className="relative h-80">
              {employeeCashStatsData?.monthlyData && employeeCashStatsData.monthlyData.length > 0 ? (
                <Bar 
                  data={{
                    labels: employeeCashStatsData.monthlyData.map((month: any) => month.month),
                    datasets: [
                      {
                        label: 'المدين',
                        data: employeeCashStatsData.monthlyData.map((month: any) => month.debit),
                        backgroundColor: primaryColor,
                        borderColor: primaryColor,
                        borderWidth: 1,
                      },
                      {
                        label: 'الدائن',
                        data: employeeCashStatsData.monthlyData.map((month: any) => month.credit),
                        backgroundColor: secondaryColor,
                        borderColor: secondaryColor,
                        borderWidth: 1,
                      },
                      {
                        label: 'الرصيد',
                        data: employeeCashStatsData.monthlyData.map((month: any) => month.balance),
                        backgroundColor: tertiaryColor,
                        borderColor: tertiaryColor,
                        borderWidth: 1,
                      },
                    ],
                  }} 
                  options={{
                    ...commonOptions,
                    plugins: {
                      ...commonOptions.plugins,
                      legend: {
                        display: true,
                        position: 'top' as const,
                        labels: {
                          font: { family: '"Tajawal", sans-serif', size: 14 }
                        }
                      },
                      tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: { family: '"Tajawal", sans-serif' },
                        bodyFont: { family: '"Tajawal", sans-serif' },
                        callbacks: {
                          label: (context: any) => {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y;
                            return `${label}: ${value.toLocaleString()}`;
                          },
                        },
                      },
                    },
                    scales: {
                      y: { 
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'المبلغ',
                          font: { family: '"Tajawal", sans-serif', size: 14 }
                        },
                        ticks: {
                          callback: function(value: any) {
                            return value.toLocaleString();
                          }
                        }
                      },
                      x: {
                        grid: { display: false },
                        title: {
                          display: true,
                          text: 'الشهر',
                          font: { family: '"Tajawal", sans-serif', size: 14 }
                        }
                      },
                    },
                  }} 
                />
              ) : (
                <div className="text-center text-gray-500 py-32">لا توجد بيانات عهد متاحة</div>
              )}
            </div>
          </div>

          {/* Row 8.7: إحصائية كشف حساب العملاء */}
          <div className="bg-white rounded-xl p-6 shadow-sm mb-5">
            <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
              <span className="bg-teal-800 text-white px-3 py-1 rounded text-sm">عملاء</span>
              <div className="flex items-center gap-4">
                <h3 className="text-base font-semibold text-gray-800">إحصائية كشف حساب العملاء</h3>
                {clientAccountsStatsData?.monthlyData && clientAccountsStatsData.monthlyData.length > 0 && (
                  <button
                    onClick={() => {
                      const tableData = clientAccountsStatsData.monthlyData.map((month: any) => ({
                        الشهر: month.month,
                        'عدد العملاء': month.clientsCount,
                        'إجمالي الإيرادات': month.totalRevenue.toFixed(2),
                        'إجمالي المصروفات': month.totalExpenses.toFixed(2),
                        'إجمالي الصافي': month.netAmount.toFixed(2),
                      }));
                      openModal('إحصائية كشف حساب العملاء', ['الشهر', 'عدد العملاء', 'إجمالي الإيرادات', 'إجمالي المصروفات', 'إجمالي الصافي'], tableData);
                    }}
                    className="bg-teal-700 text-white px-4 py-2 rounded text-sm hover:bg-teal-800"
                  >
                    عرض الجدول
                  </button>
                )}
              </div>
            </div>
            <div className="relative h-80">
              {clientAccountsStatsData?.monthlyData && clientAccountsStatsData.monthlyData.length > 0 ? (
                <Bar 
                  data={{
                    labels: clientAccountsStatsData.monthlyData.map((month: any) => month.month),
                    datasets: [
                      {
                        label: 'عدد العملاء',
                        data: clientAccountsStatsData.monthlyData.map((month: any) => month.clientsCount),
                        backgroundColor: primaryColor,
                        borderColor: primaryColor,
                        borderWidth: 1,
                        yAxisID: 'y',
                      },
                      {
                        label: 'إجمالي الإيرادات',
                        data: clientAccountsStatsData.monthlyData.map((month: any) => month.totalRevenue),
                        backgroundColor: secondaryColor,
                        borderColor: secondaryColor,
                        borderWidth: 1,
                        yAxisID: 'y1',
                      },
                      {
                        label: 'إجمالي المصروفات',
                        data: clientAccountsStatsData.monthlyData.map((month: any) => month.totalExpenses),
                        backgroundColor: tertiaryColor,
                        borderColor: tertiaryColor,
                        borderWidth: 1,
                        yAxisID: 'y1',
                      },
                      {
                        label: 'إجمالي الصافي',
                        data: clientAccountsStatsData.monthlyData.map((month: any) => month.netAmount),
                        backgroundColor: lightColor,
                        borderColor: lightColor,
                        borderWidth: 1,
                        yAxisID: 'y1',
                      },
                    ],
                  }} 
                  options={{
                    ...commonOptions,
                    plugins: {
                      ...commonOptions.plugins,
                      legend: {
                        display: true,
                        position: 'top' as const,
                        labels: {
                          font: { family: '"Tajawal", sans-serif', size: 14 }
                        }
                      },
                      tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: { family: '"Tajawal", sans-serif' },
                        bodyFont: { family: '"Tajawal", sans-serif' },
                        callbacks: {
                          label: (context: any) => {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y;
                            if (label === 'عدد العملاء') {
                              return `${label}: ${value}`;
                            }
                            return `${label}: ${value.toLocaleString()}`;
                          },
                        },
                      },
                    },
                    scales: {
                      y: { 
                        type: 'linear' as const,
                        position: 'left' as const,
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'عدد العملاء',
                          font: { family: '"Tajawal", sans-serif', size: 14 }
                        },
                        ticks: {
                          stepSize: 1,
                          precision: 0,
                        }
                      },
                      y1: {
                        type: 'linear' as const,
                        position: 'right' as const,
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'المبلغ',
                          font: { family: '"Tajawal", sans-serif', size: 14 }
                        },
                        ticks: {
                          callback: function(value: any) {
                            return value.toLocaleString();
                          }
                        },
                        grid: {
                          drawOnChartArea: false,
                        },
                      },
                      x: {
                        grid: { display: false },
                        title: {
                          display: true,
                          text: 'الشهر',
                          font: { family: '"Tajawal", sans-serif', size: 14 }
                        }
                      },
                    },
                  }} 
                />
              ) : (
                <div className="text-center text-gray-500 py-32">لا توجد بيانات كشف حساب عملاء متاحة</div>
              )}
            </div>
          </div>

          {/* Row 8.8: إحصائية قائمة الدخل */}
          <div className="bg-white rounded-xl p-6 shadow-sm mb-5">
            <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
              <div className="flex gap-3">
                {incomeStatementStatsData?.totals && (
                  <>
                    <div className="bg-teal-800 text-white px-4 py-3 rounded text-center min-w-[150px]">
                      <div className="text-xs mb-1">إجمالي العقود</div>
                      <div className="text-lg font-bold">{incomeStatementStatsData.totals.contractsCount}</div>
                    </div>
                    <div className="bg-gray-100 text-gray-700 px-4 py-3 rounded text-center min-w-[150px]">
                      <div className="text-xs mb-1">إجمالي الإيرادات</div>
                      <div className="text-lg font-bold">{incomeStatementStatsData.totals.totalRevenues.toLocaleString()}</div>
                    </div>
                    <div className="bg-blue-100 text-blue-700 px-4 py-3 rounded text-center min-w-[150px]">
                      <div className="text-xs mb-1">صافي الربح</div>
                      <div className="text-lg font-bold">{incomeStatementStatsData.totals.netProfitAfterZakat.toLocaleString()}</div>
                    </div>
                    <div className="bg-blue-50 text-blue-600 px-4 py-3 rounded text-center min-w-[150px]">
                      <div className="text-xs mb-1">إجمالي المصروفات</div>
                      <div className="text-lg font-bold">{incomeStatementStatsData.totals.totalExpenses.toLocaleString()}</div>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-4">
                <h3 className="text-base font-semibold text-gray-800">إحصائية قائمة الدخل</h3>
                {incomeStatementStatsData?.monthlyData && incomeStatementStatsData.monthlyData.length > 0 && (
                  <button
                    onClick={() => {
                      const tableData = incomeStatementStatsData.monthlyData.map((month: any) => ({
                        الشهر: month.month,
                        'عدد العقود': month.contractsCount,
                        'الإيرادات': month.totalRevenues.toFixed(2),
                        'المصروفات': month.totalExpenses.toFixed(2),
                        'صافي الربح': month.netProfitAfterZakat.toFixed(2),
                      }));
                      openModal('إحصائية قائمة الدخل', ['الشهر', 'عدد العقود', 'الإيرادات', 'المصروفات', 'صافي الربح'], tableData);
                    }}
                    className="bg-teal-700 text-white px-4 py-2 rounded text-sm hover:bg-teal-800"
                  >
                    عرض الجدول
                  </button>
                )}
              </div>
            </div>
            <div className="mb-4 text-sm text-gray-600 text-right">
              يوضح هذا الرسم البياني المؤشرات المالية الرئيسية، بما في ذلك عدد العملاء، إجمالي الايرادات، المصروفات، وصافي الإيرادات خلال الفترة الزمنية المحددة
            </div>
            <div className="relative h-80">
              {incomeStatementStatsData?.monthlyData && incomeStatementStatsData.monthlyData.length > 0 ? (
                <Bar 
                  data={{
                    labels: incomeStatementStatsData.monthlyData.map((month: any) => month.month),
                    datasets: [
                      {
                        label: 'إجمالي الإيرادات',
                        data: incomeStatementStatsData.monthlyData.map((month: any) => month.totalRevenues),
                        backgroundColor: 'rgba(255, 179, 186, 0.6)',
                        borderColor: 'rgba(255, 179, 186, 1)',
                        borderWidth: 1,
                        yAxisID: 'y',
                      },
                      {
                        label: 'إجمالي المصروفات',
                        data: incomeStatementStatsData.monthlyData.map((month: any) => month.totalExpenses),
                        backgroundColor: 'rgba(173, 216, 230, 0.6)',
                        borderColor: 'rgba(173, 216, 230, 1)',
                        borderWidth: 1,
                        yAxisID: 'y',
                      },
                      {
                        label: 'صافي الربح',
                        data: incomeStatementStatsData.monthlyData.map((month: any) => month.netProfitAfterZakat),
                        type: 'line' as const,
                        borderColor: '#2d7a7a',
                        backgroundColor: 'rgba(45, 122, 122, 0.1)',
                        borderWidth: 2,
                        pointRadius: 4,
                        pointBackgroundColor: '#2d7a7a',
                        tension: 0.3,
                        fill: false,
                        yAxisID: 'y',
                      },
                    ],
                  } as any} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                      mode: 'index' as const,
                      intersect: false,
                    },
                    plugins: {
                      legend: {
                        display: true,
                        position: 'top' as const,
                        labels: {
                          font: { family: '"Tajawal", sans-serif', size: 14 },
                          usePointStyle: true,
                        }
                      },
                      tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: { family: '"Tajawal", sans-serif' },
                        bodyFont: { family: '"Tajawal", sans-serif' },
                        callbacks: {
                          label: (context: any) => {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y;
                            return `${label}: ${value.toLocaleString()}`;
                          },
                        },
                      },
                    },
                    scales: {
                      y: { 
                        type: 'linear' as const,
                        position: 'right' as const,
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'المبلغ',
                          font: { family: '"Tajawal", sans-serif', size: 14 }
                        },
                        ticks: {
                          callback: function(value: any) {
                            return value.toLocaleString();
                          }
                        }
                      },
                      x: {
                        grid: { display: false },
                        title: {
                          display: true,
                          text: 'الشهر',
                          font: { family: '"Tajawal", sans-serif', size: 14 }
                        }
                      },
                    },
                  }} 
                />
              ) : (
                <div className="text-center text-gray-500 py-32">لا توجد بيانات قائمة الدخل متاحة</div>
              )}
            </div>
          </div>

          {/* Row 8.9: إحصائية تقرير المالي المساند */}
          <div className="bg-white rounded-xl p-6 shadow-sm mb-5">
            <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
              <div className="flex gap-3">
                {musanadFinancialStatsData?.totals && (
                  <>
                    <div className="bg-gray-100 text-gray-700 px-4 py-3 rounded text-center min-w-[150px]">
                      <div className="text-xs mb-1">إجمالي الإيرادات</div>
                      <div className="text-lg font-bold">{musanadFinancialStatsData.totals.totalRevenues.toLocaleString()}</div>
                    </div>
                    <div className="bg-blue-50 text-blue-600 px-4 py-3 rounded text-center min-w-[150px]">
                      <div className="text-xs mb-1">إجمالي المصروفات</div>
                      <div className="text-lg font-bold">{musanadFinancialStatsData.totals.totalExpenses.toLocaleString()}</div>
                    </div>
                    <div className="bg-teal-800 text-white px-4 py-3 rounded text-center min-w-[150px]">
                      <div className="text-xs mb-1">صافي الربح</div>
                      <div className="text-lg font-bold">{musanadFinancialStatsData.totals.totalNet.toLocaleString()}</div>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-4">
                <h3 className="text-base font-semibold text-gray-800">إحصائية تقرير المالي المساند</h3>
                {musanadFinancialStatsData?.monthlyData && musanadFinancialStatsData.monthlyData.length > 0 && (
                  <button
                    onClick={() => {
                      const tableData = musanadFinancialStatsData.monthlyData.map((month: any) => ({
                        الشهر: month.month,
                        'الإيرادات': month.totalRevenues.toFixed(2),
                        'المصروفات': month.totalExpenses.toFixed(2),
                        'الصافي': month.totalNet.toFixed(2),
                      }));
                      openModal('إحصائية تقرير المالي المساند', ['الشهر', 'الإيرادات', 'المصروفات', 'الصافي'], tableData);
                    }}
                    className="bg-teal-700 text-white px-4 py-2 rounded text-sm hover:bg-teal-800"
                  >
                    عرض الجدول
                  </button>
                )}
              </div>
            </div>
            <div className="mb-4 text-sm text-gray-600 text-right">
              يوضح الرسم البياني أهم المؤشرات المالية والإدارية بما في ذلك الإيرادات المصروفات واجمالي الصافي خلال الفترة الزمنية المحددة
            </div>
            <div className="relative h-80">
              {musanadFinancialStatsData?.monthlyData && musanadFinancialStatsData.monthlyData.length > 0 ? (
                <Bar 
                  data={{
                    labels: musanadFinancialStatsData.monthlyData.map((month: any) => month.month),
                    datasets: [
                      {
                        label: 'إجمالي الإيرادات',
                        data: musanadFinancialStatsData.monthlyData.map((month: any) => month.totalRevenues),
                        backgroundColor: 'rgba(255, 179, 186, 0.6)',
                        borderColor: 'rgba(255, 179, 186, 1)',
                        borderWidth: 1,
                        yAxisID: 'y',
                      },
                      {
                        label: 'إجمالي المصروفات',
                        data: musanadFinancialStatsData.monthlyData.map((month: any) => month.totalExpenses),
                        backgroundColor: 'rgba(144, 238, 144, 0.6)',
                        borderColor: 'rgba(144, 238, 144, 1)',
                        borderWidth: 1,
                        yAxisID: 'y',
                      },
                      {
                        label: 'إجمالي الصافي',
                        data: musanadFinancialStatsData.monthlyData.map((month: any) => month.totalNet),
                        type: 'line' as const,
                        borderColor: '#2d7a7a',
                        backgroundColor: 'rgba(45, 122, 122, 0.1)',
                        borderWidth: 2,
                        pointRadius: 4,
                        pointBackgroundColor: '#2d7a7a',
                        tension: 0.3,
                        fill: false,
                        yAxisID: 'y',
                      },
                    ],
                  } as any} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                      mode: 'index' as const,
                      intersect: false,
                    },
                    plugins: {
                      legend: {
                        display: true,
                        position: 'top' as const,
                        labels: {
                          font: { family: '"Tajawal", sans-serif', size: 14 },
                          usePointStyle: true,
                        }
                      },
                      tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: { family: '"Tajawal", sans-serif' },
                        bodyFont: { family: '"Tajawal", sans-serif' },
                        callbacks: {
                          label: (context: any) => {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y;
                            return `${label}: ${value.toLocaleString()}`;
                          },
                        },
                      },
                    },
                    scales: {
                      y: { 
                        type: 'linear' as const,
                        position: 'right' as const,
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'المبلغ',
                          font: { family: '"Tajawal", sans-serif', size: 14 }
                        },
                        ticks: {
                          callback: function(value: any) {
                            return value.toLocaleString();
                          }
                        }
                      },
                      x: {
                        grid: { display: false },
                        title: {
                          display: true,
                          text: 'الشهر',
                          font: { family: '"Tajawal", sans-serif', size: 14 }
                        }
                      },
                    },
                  }} 
                />
              ) : (
                <div className="text-center text-gray-500 py-32">لا توجد بيانات تقرير مالي مساند متاحة</div>
              )}
            </div>
          </div>

          {/* Row 8.10: إحصائية التسوية المالية */}
          <div className="bg-white rounded-xl p-6 shadow-sm mb-5">
            <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
              <div className="flex items-center gap-4">
                <h3 className="text-base font-semibold text-gray-800">إحصائية التسوية المالية</h3>
                {settlementStatsData?.monthlyData && settlementStatsData.monthlyData.length > 0 && (
                  <button
                    onClick={() => {
                      const tableData = settlementStatsData.monthlyData.map((month: any) => ({
                        الشهر: month.month,
                        'قيمة العقود': month.contractValue.toFixed(2),
                        'اجمالي المدفوعات': month.totalPaid.toFixed(2),
                        'اجمالي المصروفات': month.totalExpenses.toFixed(2),
                        'الصافي': month.netAmount.toFixed(2),
                      }));
                      openModal('إحصائية التسوية المالية', ['الشهر', 'قيمة العقود', 'اجمالي المدفوعات', 'اجمالي المصروفات', 'الصافي'], tableData);
                    }}
                    className="bg-teal-700 text-white px-4 py-2 rounded text-sm hover:bg-teal-800"
                  >
                    عرض الجدول
                  </button>
                )}
              </div>
            </div>
            <div className="mb-4 text-sm text-gray-600 text-right">
              يوضح الرسم البياني المؤشرات الرئيسية للتسوية المالية، بما في ذلك قيمة العقود، اجمالي المدفوعات، اجمالي المصروفات والصافي خلال الفترة المحددة.
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Section: Combination Chart */}
              <div className="lg:col-span-2 relative h-80">
                {settlementStatsData?.monthlyData && settlementStatsData.monthlyData.length > 0 ? (
                  <Bar 
                    data={{
                      labels: settlementStatsData.monthlyData.map((month: any) => month.month),
                      datasets: [
                        {
                          label: 'قيمة العقود',
                          data: settlementStatsData.monthlyData.map((month: any) => month.contractValue),
                          backgroundColor: 'rgba(255, 179, 186, 0.6)',
                          borderColor: 'rgba(255, 179, 186, 1)',
                          borderWidth: 1,
                          yAxisID: 'y',
                        },
                        {
                          label: 'اجمالي المدفوعات',
                          data: settlementStatsData.monthlyData.map((month: any) => month.totalPaid),
                          backgroundColor: 'rgba(173, 216, 230, 0.6)',
                          borderColor: 'rgba(173, 216, 230, 1)',
                          borderWidth: 1,
                          yAxisID: 'y',
                        },
                        {
                          label: 'اجمالي المصروفات',
                          data: settlementStatsData.monthlyData.map((month: any) => month.totalExpenses),
                          backgroundColor: 'rgba(144, 238, 144, 0.6)',
                          borderColor: 'rgba(144, 238, 144, 1)',
                          borderWidth: 1,
                          yAxisID: 'y',
                        },
                        {
                          label: 'الصافي',
                          data: settlementStatsData.monthlyData.map((month: any) => month.netAmount),
                          type: 'line' as const,
                          borderColor: '#2d7a7a',
                          backgroundColor: 'rgba(45, 122, 122, 0.1)',
                          borderWidth: 2,
                          pointRadius: 4,
                          pointBackgroundColor: '#2d7a7a',
                          tension: 0.3,
                          fill: false,
                          yAxisID: 'y',
                        },
                      ],
                    } as any} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      interaction: {
                        mode: 'index' as const,
                        intersect: false,
                      },
                      plugins: {
                        legend: {
                          display: true,
                          position: 'top' as const,
                          labels: {
                            font: { family: '"Tajawal", sans-serif', size: 14 },
                            usePointStyle: true,
                          }
                        },
                        tooltip: {
                          enabled: true,
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          titleFont: { family: '"Tajawal", sans-serif' },
                          bodyFont: { family: '"Tajawal", sans-serif' },
                          callbacks: {
                            label: (context: any) => {
                              const label = context.dataset.label || '';
                              const value = context.parsed.y;
                              return `${label}: ${value.toLocaleString()}`;
                            },
                          },
                        },
                      },
                      scales: {
                        y: { 
                          type: 'linear' as const,
                          position: 'right' as const,
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'المبلغ',
                            font: { family: '"Tajawal", sans-serif', size: 14 }
                          },
                          ticks: {
                            callback: function(value: any) {
                              return value.toLocaleString();
                            }
                          }
                        },
                        x: {
                          grid: { display: false },
                          title: {
                            display: true,
                            text: 'الشهر',
                            font: { family: '"Tajawal", sans-serif', size: 14 }
                          }
                        },
                      },
                    }} 
                  />
                ) : (
                  <div className="text-center text-gray-500 py-32">لا توجد بيانات تسوية مالية متاحة</div>
                )}
              </div>

              {/* Right Section: Donut Chart and Summary */}
              <div className="lg:col-span-1 flex flex-col items-center justify-center">
                {settlementStatsData?.totals ? (
                  <>
                    <div className="relative w-64 h-64 mb-6">
                      <Doughnut
                        data={{
                          labels: ['الصافي', 'اجمالي المصروفات', 'اجمالي المدفوعات'],
                          datasets: [
                            {
                              data: [
                                settlementStatsData.totals.totalNet,
                                settlementStatsData.totals.totalExpenses,
                                settlementStatsData.totals.totalPaid,
                              ],
                              backgroundColor: [
                                'rgba(255, 179, 186, 0.8)',
                                'rgba(173, 216, 230, 0.8)',
                                '#2d7a7a',
                              ],
                              borderColor: [
                                'rgba(255, 179, 186, 1)',
                                'rgba(173, 216, 230, 1)',
                                '#2d7a7a',
                              ],
                              borderWidth: 2,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: true,
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
                                label: (context: any) => {
                                  const label = context.label || '';
                                  const value = context.parsed;
                                  const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                                  const percentage = ((value / total) * 100).toFixed(1);
                                  return `${label}: ${value.toLocaleString()} (${percentage}%)`;
                                },
                              },
                            },
                          },
                          cutout: '60%',
                        }}
                      />
                      {/* Center Text */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-gray-800">
                            {(settlementStatsData.totals.totalPaid + settlementStatsData.totals.totalExpenses + settlementStatsData.totals.totalNet).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Summary Labels */}
                    <div className="space-y-3 w-full">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(255, 179, 186, 0.8)' }}></div>
                        <div className="flex-1 text-right">
                          <div className="text-sm text-gray-600">الصافي</div>
                          <div className="text-lg font-bold text-gray-800">{settlementStatsData.totals.totalNet.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(173, 216, 230, 0.8)' }}></div>
                        <div className="flex-1 text-right">
                          <div className="text-sm text-gray-600">اجمالي المصروفات</div>
                          <div className="text-lg font-bold text-gray-800">{settlementStatsData.totals.totalExpenses.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#2d7a7a' }}></div>
                        <div className="flex-1 text-right">
                          <div className="text-sm text-gray-600">اجمالي المدفوعات</div>
                          <div className="text-lg font-bold text-gray-800">{settlementStatsData.totals.totalPaid.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-gray-500 py-16">لا توجد بيانات</div>
                )}
              </div>
            </div>
          </div>

          {/* Row 8.11: إحصائية الاقرار الضريبي */}
          <div className="bg-white rounded-xl p-6 shadow-sm mb-5">
            <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-200">
              <div className="flex items-center gap-4">
                <h3 className="text-base font-semibold text-gray-800">إحصائية الاقرار الضريبي</h3>
                {taxMonthlyStatsData?.monthlyData && taxMonthlyStatsData.monthlyData.length > 0 && (
                  <button
                    onClick={() => {
                      const tableData = taxMonthlyStatsData.monthlyData.map((month: any) => ({
                        الشهر: month.month,
                        'اجمالي ضريبة المبيعات': month.totalSalesTax.toFixed(2),
                        'اجمالي ضريبة المشتريات': month.totalPurchaseTax.toFixed(2),
                        'اجمالي الضريبة المستحقة': month.netDueTax.toFixed(2),
                      }));
                      openModal('إحصائية الاقرار الضريبي', ['الشهر', 'اجمالي ضريبة المبيعات', 'اجمالي ضريبة المشتريات', 'اجمالي الضريبة المستحقة'], tableData);
                    }}
                    className="bg-teal-700 text-white px-4 py-2 rounded text-sm hover:bg-teal-800"
                  >
                    عرض الجدول
                  </button>
                )}
              </div>
            </div>
            <div className="mb-4 text-sm text-gray-600 text-right">
              يوضح الرسم البياني المؤشرات الرئيسية للإقرار الضريبي، بما في ذلك ضريبة المبيعات، ضريبة المشتريات وصافي الضريبة المستحقة خلال الفترة المحددة.
            </div>
            <div className="relative h-96">
              {taxMonthlyStatsData?.monthlyData && taxMonthlyStatsData.monthlyData.length > 0 ? (
                <Bar 
                  data={{
                    labels: taxMonthlyStatsData.monthlyData.map((month: any) => month.month),
                    datasets: [
                      {
                        label: 'اجمالي ضريبة المبيعات',
                        data: taxMonthlyStatsData.monthlyData.map((month: any) => month.totalSalesTax),
                        backgroundColor: '#2d7a7a', // Dark teal/green
                        borderColor: '#2d7a7a',
                        borderWidth: 1,
                      },
                      {
                        label: 'اجمالي ضريبة المشتريات',
                        data: taxMonthlyStatsData.monthlyData.map((month: any) => month.totalPurchaseTax),
                        backgroundColor: '#7dd3c0', // Light teal/mint green
                        borderColor: '#7dd3c0',
                        borderWidth: 1,
                      },
                      {
                        label: 'اجمالي الضريبة المستحقة',
                        data: taxMonthlyStatsData.monthlyData.map((month: any) => month.netDueTax),
                        backgroundColor: '#a8c5e0', // Light blue/lavender
                        borderColor: '#a8c5e0',
                        borderWidth: 1,
                      },
                    ],
                  }} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: true,
                        position: 'bottom' as const,
                        labels: {
                          font: { family: '"Tajawal", sans-serif', size: 12 },
                          padding: 15,
                        },
                      },
                      tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: { family: '"Tajawal", sans-serif' },
                        bodyFont: { family: '"Tajawal", sans-serif' },
                        callbacks: {
                          label: (context: any) => {
                            const value = context.parsed.y;
                            return `${context.dataset.label}: ${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
                          },
                        },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 4000,
                          font: {
                            family: '"Tajawal", sans-serif',
                            size: 12,
                          },
                          callback: function(value: any) {
                            return value.toLocaleString('ar-SA');
                          },
                        },
                        grid: {
                          color: 'rgba(0, 0, 0, 0.1)',
                        },
                      },
                      x: {
                        ticks: {
                          font: {
                            family: '"Tajawal", sans-serif',
                            size: 11,
                          },
                        },
                        grid: {
                          display: false,
                        },
                      },
                    },
                  }} 
                />
              ) : (
                <div className="text-center text-gray-500 py-32">لا توجد بيانات اقرار ضريبي متاحة</div>
              )}
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