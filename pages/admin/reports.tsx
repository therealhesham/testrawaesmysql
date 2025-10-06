/*
الحالات المختلفة التي يتم التعامل معها
medicalCheck
travelPermit
foreignLaborApproval
saudiEmbassyApproval
*/


// pages/reports.tsx
import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import Script from 'next/script';

const Chart = dynamic(() => import('react-chartjs-2').then(mod => ({
  default: mod.Chart
})), { ssr: false });

interface ReportsData {
  orders: {
    total: number;
    byStatus: any[];
    byMonth: { [key: string]: number };
  };
  citiesSources: {
    byCity: any[];
    bySource: any[];
  };
  clientsReceivables: {
    total: number;
    withReceivables: number;
    withoutReceivables: number;
  };
  tasks: {
    total: number;
    completed: number;
    incomplete: number;
    byPriority: any[];
  };
  workersNationality: {
    byNationality: any[];
  };
  housing: {
    byNationality: { [key: string]: number };
    total: number;
  };
  foodHousing: {
    locationStats: any[];
    checkInStats: number;
    totalHousedWorkers: number;
  };
  medical: {
    totalPassed: number;
    byRegion: { name: string; count: number }[];
  };
}

declare global {
  interface Window {
    Highcharts: any;
  }
}

const ReportsPage = () => {
  const ordersLineChartRef = useRef(null);
  const ordersDoughnutChartRef = useRef(null);
  const cityBarChartRef = useRef(null);
  const workersBarChartRef = useRef(null);
  const clientsDoughnutChartRef = useRef(null);
  const housingDonutChartRef = useRef(null);
  const foodBarChartRef = useRef(null);
  const nationalityBarChartRef = useRef(null);
  const tasksDonutChartRef = useRef(null);

  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);

async function fetchReportsData() {
  try {
    setLoading(true);
    const response = await fetch('/api/reports');
    const data = await response.json();
    setReportsData(data);
    return data;
  } catch (error) {
    console.error('Error fetching reports data:', error);
  } finally {
    setLoading(false);
  }
}

  useEffect(() => {
    fetchReportsData();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && reportsData && window.Highcharts) {
      // Dynamically import Chart.js to avoid SSR issues
      import('chart.js/auto').then((ChartJS) => {
        // الطلبات حسب الشهر - Line Chart
        if (ordersLineChartRef.current) {
          const monthLabels = Object.keys(reportsData.orders.byMonth).sort();
          const monthData = monthLabels.map(month => reportsData.orders.byMonth[month]);
          
          const monthNames: { [key: string]: string } = {
            '01': 'يناير', '02': 'فبراير', '03': 'مارس', '04': 'أبريل',
            '05': 'مايو', '06': 'يونيو', '07': 'يوليو', '08': 'أغسطس',
            '09': 'سبتمبر', '10': 'أكتوبر', '11': 'نوفمبر', '12': 'ديسمبر'
          };
          
          const arabicMonths = monthLabels.map(month => {
            const monthNum = month.split('-')[1];
            return monthNames[monthNum] || month;
          });

          new ChartJS.default(ordersLineChartRef.current, {
            type: 'line',
            data: {
              labels: arabicMonths,
              datasets: [{
                label: 'عدد الطلبات',
                data: monthData,
                borderColor: '#4a8da4',
                backgroundColor: 'rgba(74, 141, 164, 0.1)',
                fill: true,
                tension: 0.4
              }]
            },
            options: {
              responsive: true,
              plugins: {
                legend: {
                  display: true,
                  position: 'top'
                }
              },
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            }
          });
        }

        // حالات الطلبات - Doughnut Chart
        if (ordersDoughnutChartRef.current && reportsData.orders.byStatus.length > 0) {
          const statusLabels = reportsData.orders.byStatus.map((item: any) => item.bookingstatus || 'غير محدد');
          const statusData = reportsData.orders.byStatus.map((item: any) => item._count.id);
          
          new ChartJS.default(ordersDoughnutChartRef.current, {
            type: 'doughnut',
            data: {
              labels: statusLabels,
              datasets: [{
                data: statusData,
                backgroundColor: ['#800020', '#7da6b1','#7d58b1', '#c43b64', '#d8d8d8', '#6b7280']
              }]
            },
            options: {
              responsive: true,
              plugins: {
                legend: {
                  position: 'bottom'
                }
              }
            }
          });
        }

        // العملاء حسب المدينة - Bar Chart
        if (cityBarChartRef.current && reportsData.citiesSources.byCity.length > 0) {
          const cityLabels = reportsData.citiesSources.byCity.map((item: any) => item.city || 'غير محدد');
          const cityData = reportsData.citiesSources.byCity.map((item: any) => item._count.id);

          new ChartJS.default(cityBarChartRef.current, {
            type: 'bar',
            data: {
              labels: cityLabels,
              datasets: [{
                label: 'عدد العملاء',
                data: cityData,
                backgroundColor: '#4a8da4',
                borderColor: '#4a8da4',
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              plugins: {
                legend: {
                  display: false
                }
              },
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            }
          });
        }

        // العاملات حسب الجنسية - Bar Chart
        if (workersBarChartRef.current && reportsData.workersNationality.byNationality.length > 0) {
          const nationalityLabels = reportsData.workersNationality.byNationality.map((item: any) => item.Nationalitycopy || 'غير محدد');
          const nationalityData = reportsData.workersNationality.byNationality.map((item: any) => item._count.id);

          new ChartJS.default(workersBarChartRef.current, {
            type: 'bar',
            data: {
              labels: nationalityLabels,
              datasets: [{
                label: 'عدد العاملات',
                data: nationalityData,
                backgroundColor: '#7da6b1',
                borderColor: '#7da6b1',
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              plugins: {
                legend: {
                  display: false
                }
              },
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            }
          });
        }

        // العملاء (المستحقات) - Doughnut Chart
        if (clientsDoughnutChartRef.current) {
          new ChartJS.default(clientsDoughnutChartRef.current, {
            type: 'doughnut',
            data: {
              labels: ['لديهم مستحقات', 'بدون مستحقات'],
              datasets: [{
                data: [reportsData.clientsReceivables.withReceivables, reportsData.clientsReceivables.withoutReceivables],
                backgroundColor: ['#c43b64', '#4a8da4']
              }]
            },
            options: {
              responsive: true,
              plugins: {
                legend: {
                  position: 'bottom'
                }
              }
            }
          });
        }

        // المهام - Doughnut Chart  
        if (tasksDonutChartRef.current) {
          new ChartJS.default(tasksDonutChartRef.current, {
            type: 'doughnut',
            data: {
              labels: ['مكتملة', 'غير مكتملة'],
              datasets: [{
                data: [reportsData.tasks.completed, reportsData.tasks.incomplete],
                backgroundColor: ['#4a8da4', '#d8d8d8']
              }]
            },
            options: {
              responsive: true,
              plugins: {
                legend: {
                  position: 'bottom'
                }
              }
            }
          });
        }

        // التسكين حسب الجنسية - Doughnut Chart
        if (housingDonutChartRef.current) {
          const housingLabels = Object.keys(reportsData.housing.byNationality);
          const housingData = Object.values(reportsData.housing.byNationality);

          new ChartJS.default(housingDonutChartRef.current, {
            type: 'doughnut',
            data: {
              labels: housingLabels,
              datasets: [{
                data: housingData,
                backgroundColor: ['#4a8da4', '#7da6b1', '#c43b64', '#d8d8d8', '#6b7280']
              }]
            },
            options: {
              responsive: true,
              plugins: {
                legend: {
                  position: 'bottom'
                }
              }
            }
          });
        }

        // الاعاشة - عدد العاملات في كل سكن - Bar Chart
        if (foodBarChartRef.current && reportsData.foodHousing.locationStats.length > 0) {
          const locationLabels = reportsData.foodHousing.locationStats.map((item: any) => item.location);
          const locationData = reportsData.foodHousing.locationStats.map((item: any) => item.currentCount);
          const capacityData = reportsData.foodHousing.locationStats.map((item: any) => item.capacity);

          new ChartJS.default(foodBarChartRef.current, {
            type: 'bar',
            data: {
              labels: locationLabels,
              datasets: [{
                label: 'العدد الحالي',
                data: locationData,
                backgroundColor: '#4a8da4',
                borderColor: '#4a8da4',
                borderWidth: 1
              }, {
                label: 'السعة الكاملة',
                data: capacityData,
                backgroundColor: '#d8d8d8',
                borderColor: '#d8d8d8',
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              plugins: {
                legend: {
                  position: 'top'
                }
              },
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            }
          });
        }
      });

      // Create Highcharts Map
// Create Highcharts Map
if (reportsData.citiesSources.byCity.length > 0) {
  // دالة لتحميل Highcharts ديناميكيًا
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
      '‘Asīr': 'sa-as',
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
      '‘Asīr': 'عسير',
      'Tabūk': 'تبوك',
      'Al Ḩudūd ash Shamālīyah': 'الحدود الشمالية',
      'Jazan': 'جازان',
      'Najrān': 'نجران',
      'Al Bāḩah': 'الباحة',
      'Al Jawf': 'الجوف',
      'Al Qaşīm': 'القصيم',
      'Ḩa\'il': 'حائل',
    };

    const data = reportsData.citiesSources.byCity
      .map((item: any) => {
        const eng = item.city;
        const hcKey = regionMap[eng];
        const name = arabicRegionMap[eng];
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

      window.Highcharts.mapChart('medical-map-container', {series: [{
  // ...
  nullColor: '#14B8A6', // رمادي فاتح للمناطق بدون بيانات
  borderColor: '#F5FF57',
  borderWidth: 1,
}],
        chart: { map: topology },
        title: { text: 'العملاء حسب المدينة' },
        mapNavigation: { enabled: true },
        colorAxis: {
  min: 0,
  minColor: '#14B8A6',   // لون المناطق ذات القيمة القليلة (أو صفر)
  maxColor: '#134E4A',//teal-800   // لون المناطق ذات القيمة العالية
  // يمكنك إضافة stops لتدرج أكثر دقة:
  // stops: [
  //   [0, '#E6F4EA'],
  //   [0.5, '#81C995'],
  //   [1, '#0F9D58']
  // ]
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
} else {
  setMapLoaded(true);
}
    }
  }, [reportsData]);

  return (
    <>
<Head>
  <title>لوحة التقارير</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet" />
  {/* تأكد من عدم وجود مسافات في الروابط */}
  <script src="https://code.highcharts.com/maps/highmaps.js"></script>
  <script src="https://code.highcharts.com/maps/modules/exporting.js"></script>
</Head>      <Script
        src="https://cdn.jsdelivr.net/npm/chart.js"
        strategy="afterInteractive"
      />
      <main className="p-10 max-w-7xl mx-auto bg-gray-100 min-h-screen" dir="rtl" lang="ar">
        <style jsx global>{`
          body {
            font-family: 'Tajawal', sans-serif;
          }
          #medical-map-container {
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
        `}</style>
        <h1 className="text-center text-gray-800 mb-8 text-3xl font-bold">التقارير الإحصائية</h1>
        
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="mr-3 text-gray-600">جاري تحميل البيانات...</span>
          </div>
        )}

        {!loading && reportsData && (
          <div className="flex flex-col gap-8">
            {/* إحصائيات الطلبات */}
            <section className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  احصائيات الطلبات (المجموع: {reportsData?.orders?.total})
                </h3>
                <div className="flex gap-3 items-center">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-sm font-medium">
                    آخر 6 شهور
                  </span>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-5">
                يوضح الرسم البياني توزيع الطلبات حسب الشهر وحالة كل طلب، مما يساعد في متابعة الأداء بدقة.
              </p>
              <div className="flex flex-wrap gap-5">
                <div className="flex-1 min-w-[300px]">
                  <h4 className="text-center text-gray-700 mb-2 font-medium">الطلبات حسب الشهر</h4>
                  <canvas ref={ordersLineChartRef} />
                </div>
                <div className="flex-1 min-w-[300px]">
                  <h4 className="text-center text-gray-700 mb-2 font-medium">حالة الطلبات</h4>
                  <canvas ref={ordersDoughnutChartRef} />
                </div>
              </div>
            </section>

            {/* احصائيات المدن / المصادر */}
            <section className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-900">احصائيات المدن والمصادر</h3>
              </div>
              <p className="text-gray-600 text-sm mb-5">
                يوضح توزيع العملاء حسب المدينة، مما يساعد في فهم التوزيع الجغرافي للعملاء.
              </p>
              <div className="flex flex-wrap gap-5">
                <div className="flex-1 min-w-[300px]">
                  <h4 className="text-center text-gray-700 mb-2 font-medium">العملاء حسب المدينة</h4>
                  <canvas ref={cityBarChartRef} />
                </div>
              </div>
            </section>

            {/* New Section: Medical Checks by Regions Map */}
            <section className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  احصائيات العملاء حسب المدينة (المجموع: {reportsData?.citiesSources?.byCity?.length || 0})
                </h3>
              </div>
              <p className="text-gray-600 text-sm mb-5">
                خريطة تفاعلية بسيطة للمملكة العربية السعودية توضح عدد الفحوصات الطبية المجتازة حسب المنطقة. الألوان تشير إلى كثافة الفحوصات.
              </p>
              {reportsData?.citiesSources?.byCity.length > 0 && !mapLoaded ? (
                <div className="loading">جاري تحميل الخريطة...</div>
              ) : reportsData?.citiesSources?.byCity.length > 0 ? (
                <div id="medical-map-container"></div>
              ) : (
                <p className="text-gray-500 text-right">لا توجد بيانات عملاء متاحة حالياً.</p>
              )}
            </section>

            {/* إحصائيات العملاء والمهام - side by side */}
            <div className="flex gap-8">
              <section className="bg-white rounded-lg p-6 shadow-sm flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  احصائيات العملاء (المجموع: {reportsData?.clientsReceivables?.total})
                </h3>
                <p className="text-gray-600 text-sm mb-4">المستحقات المالية</p>
                <canvas ref={clientsDoughnutChartRef} />
              </section>
              <section className="bg-white rounded-lg p-6 shadow-sm flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  احصائيات المهام (المجموع: {reportsData?.tasks?.total})
                </h3>
                <p className="text-gray-600 text-sm mb-4">حالة إنجاز المهام</p>
                <canvas ref={tasksDonutChartRef} />
              </section>
            </div>

            {/* احصائيات العاملات حسب الجنسية */}
            <section className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">احصائيات العاملات حسب الجنسية</h3>
              <p className="text-gray-600 text-sm mb-4">
                توزيع العاملات المسجلات في النظام حسب جنسياتهن
              </p>
              <canvas ref={workersBarChartRef} />
            </section>

            {/* إحصائيات التسكين */}
            <section className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                احصائيات التسكين (المجموع: {reportsData?.housing?.total})
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                توزيع العاملات المسكنات حسب الجنسية - رسم بياني دائري
              </p>
              <div className="max-w-md mx-auto">
                <canvas ref={housingDonutChartRef} />
              </div>
            </section>

            {/* احصائيات الاعاشة والسكن */}
            <section className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                احصائيات الاعاشة والسكن (المجموع: {reportsData?.foodHousing?.totalHousedWorkers})
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                عدد العاملات في كل موقع سكن مقارنة بالسعة الكاملة
              </p>
              {reportsData?.foodHousing?.locationStats.length > 0 ? (
                <div>
                  <canvas ref={foodBarChartRef} />
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reportsData?.foodHousing?.locationStats.map((location: any, index: number) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-semibold text-gray-800 mb-2">{location.location}</h5>
                        <div className="space-y-1 text-sm">
                          <p>العدد الحالي: <span className="font-medium text-blue-600">{location.currentCount}</span></p>
                          <p>السعة الكاملة: <span className="font-medium text-gray-600">{location.capacity}</span></p>
                          <p>المتاح: <span className="font-medium text-green-600">{location.available}</span></p>
                        </div>
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{width: `${(location.currentCount / location.capacity) * 100}%`}}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {Math.round((location.currentCount / location.capacity) * 100)}% مشغول
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  لا توجد بيانات متاحة حالياً
                </div>
              )}
            </section>
          </div>
        )}

        {!loading && !reportsData && (
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">حدث خطأ في تحميل البيانات</div>
            <button 
              onClick={fetchReportsData}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              إعادة المحاولة
            </button>
          </div>
        )}
      </main>
    </>
  );
};

export default ReportsPage;