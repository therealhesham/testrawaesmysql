import { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import Image from 'next/image';
import Layout from 'example/containers/Layout';
import Style from 'styles/Home.module.css';

export default function Home() {
  const [currentOrdersLength, setCurrentOrdersLength] = useState(0);
  const [cancelledorders, setCancelledorders] = useState(0);
  const [deparaturesLength, setDeparaturesLength] = useState(0);
  const [newOrdersLength, setNewOrdersLength] = useState(0);
  const [homeMaidsLength, setHomeMaidsLength] = useState(0);
  const [arrivalsLength, setArrivalsLength] = useState(0);
  const [rejectedOrdersLength, setRejectedOrdersLength] = useState(0);
  const [finished, setFinished] = useState(0);
  const [officesLength, setOfficesLengthLength] = useState(0);
  const [transferSponsorshipsLength, setTransferSponsorshipsLength] = useState(0);
  const [workersStats, setWorkersStats] = useState<{ [key: string]: number }>({});

  const ordersLineRef = useRef(null);
  const ordersDoughnutRef = useRef(null);
  const cityBarRef = useRef(null);
  const workersBarRef = useRef(null);
  const clientsDoughnutRef = useRef(null);
  const housingDonutRef = useRef(null);
  const foodLineRef = useRef(null);
  const nationalityBarRef = useRef(null);

  const doughnutInstance = useRef(null);

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/datalength`);
      const res = await response.json();
      if (response.status === 200) {
        setDeparaturesLength(res.deparatures);
        setArrivalsLength(res.arrivals);
        setCurrentOrdersLength(res.currentorders);
        setRejectedOrdersLength(res.rejectedOrders);
        setHomeMaidsLength(res.workers);
        setTransferSponsorshipsLength(res.transferSponsorships);
        setNewOrdersLength(res.neworderCount);
        setFinished(res.finished);
        setCancelledorders(res.cancelledorders);
        setOfficesLengthLength(res.offices);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // Fetch العاملات حسب الدولة
  const fetchWorkersStats = async () => {
    try {
      const res = await fetch('/api/datalength');
      const data = await res.json();
      if (res.ok) {
        setWorkersStats(data.newOrderByLocation || {});
      }
    } catch (error) {
      console.error('Error fetching workers stats:', error);
    }
  };

  const getLast7Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      days.push(date.toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric' }));
    }
    return days;
  };

  useEffect(() => {
    fetchData();
    fetchWorkersStats();

    new Chart(ordersLineRef.current, {
      type: 'line',
      data: {
        labels: getLast7Days(),
        datasets: [{
          label: 'عدد الطلبات',
          data: [12, 19, 3, 5, 2, 8, 7],
          borderColor: '#A9D9D3',
          fill: false
        }]
      }
    });

    doughnutInstance.current = new Chart(ordersDoughnutRef.current, {
      type: 'doughnut',
      data: {
        labels: ['جديد', 'قيد المعالجة', 'مكتمل', 'ملغي', 'مرفوض'],
        datasets: [{
          data: [0, 0, 0, 0, 0],
          backgroundColor: ['#4F1A2F', '#1A4D4F', '#E0E0E0', '#F1D7E5', '#A3BFF6'],
        }]
      }
    });

    new Chart(cityBarRef.current, {
      type: 'bar',
      data: {
        labels: ['الرياض', 'جدة', 'مكة', 'الدمام', 'القصيم'],
        datasets: [{
          label: 'عدد الطلبات',
          data: [30, 20, 25, 15, 10],
          backgroundColor: '#1A4D4F'
        }]
      }
    });

    new Chart(clientsDoughnutRef.current, {
      type: 'doughnut',
      data: {
        labels: ['نشط', 'غير نشط'],
        datasets: [{
          data: [32, 68],
          backgroundColor: ['#1A4D4F', '#E0E0E0']
        }]
      }
    });

    new Chart(housingDonutRef.current, {
      type: 'doughnut',
      data: {
        labels: ['جيد', 'متوسط', 'ضعيف'],
        datasets: [{
          data: [60, 25, 15],
          backgroundColor: ['#4a8da4', '#c43b64', '#ccc']
        }]
      }
    });

    new Chart(foodLineRef.current, {
      type: 'line',
      data: {
        labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو'],
        datasets: [{
          label: 'رضا التغذية',
          data: [20, 25, 15, 30, 40],
          borderColor: '#c43b64',
          fill: false
        }]
      }
    });

    new Chart(nationalityBarRef.current, {
      type: 'bar',
      data: {
        labels: ['الفلبين', 'اندونيسيا', 'سيرلانكا', 'اثيوبيا'],
        datasets: [{
          label: 'عدد الموظفين',
          data: [12, 17, 10, 5],
          backgroundColor: '#4a8da4'
        }]
      }
    });

  }, []);

  // رسم العاملات بعد جلب البيانات من API
  useEffect(() => {
    if (Object.keys(workersStats).length > 0 && workersBarRef.current) {
      new Chart(workersBarRef.current, {
        type: 'bar',
        data: {
          labels: Object.keys(workersStats),
          datasets: [{
            label: 'عدد العاملات',
            data: Object.values(workersStats),
            backgroundColor: '#1A4D4F'
          }]
        }
      });
    }
  }, [workersStats]);

  useEffect(() => {
    if (doughnutInstance.current) {
      doughnutInstance.current.data.datasets[0].data = [
        newOrdersLength,
        currentOrdersLength,
        finished,
        cancelledorders,
        rejectedOrdersLength
      ];
      doughnutInstance.current.update();
    }
  }, [newOrdersLength, currentOrdersLength, finished, cancelledorders, rejectedOrdersLength]);

  return (
    <Layout>
      <main className={`p-10 max-w-6xl mx-auto ${Style["tajawal-medium  "]}`}>
        <h1 className="text-3xl text-center font-bold mb-10 text-gray-800">التقارير</h1>

        <div className="flex flex-col gap-8">
          {/* احصائيات الطلبات */}
          <section className="bg-white p-6 rounded-xl shadow">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-semibold text-gray-700">احصائيات الطلبات</h3>
            </div>
            <div className="flex flex-wrap gap-5">
              <div className="flex-1 min-w-[300px]"><canvas ref={ordersLineRef} /></div>
              <div className="flex-1 min-w-[300px]"><canvas ref={ordersDoughnutRef} /></div>
            </div>
          </section>

          {/* المدن */}
          <section className="bg-white p-6 rounded-xl shadow">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-semibold text-gray-700">احصائيات المدن \ المصادر</h3>
            </div>
            <div className="flex flex-wrap gap-5">
              <div className="flex-1 min-w-[300px]">
                <Image src="/map.png" width={400} height={300} alt="خريطة السعودية" />
              </div>
              <div className="flex-1 min-w-[300px]"><canvas ref={cityBarRef} /></div>
            </div>
          </section>

          {/* العاملات والعملاء */}
          <div className="flex flex-wrap gap-5">
            <section className="flex-1 bg-white p-6 rounded-xl shadow min-w-[300px]">
              <h3 className="text-xl font-semibold mb-3 text-gray-700">احصائيات العاملات</h3>
              <canvas ref={workersBarRef} />
            </section>
            <section className="flex-1 bg-white p-6 rounded-xl shadow min-w-[300px]">
              <h3 className="text-xl font-semibold mb-3 text-gray-700">احصائيات العملاء</h3>
              <canvas ref={clientsDoughnutRef} />
            </section>
          </div>

          {/* السكن */}
          <section className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-xl font-semibold mb-3 text-gray-700">احصاءات السكن</h3>
            <canvas ref={housingDonutRef} />
          </section>

          {/* التغذية */}
          <section className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-xl font-semibold mb-3 text-gray-700">احصائيات التغذية الصحية</h3>
            <canvas ref={foodLineRef} />
          </section>

          {/* الجنسية */}
          <section className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-xl font-semibold mb-3 text-gray-700">الموظفين حسب الجنسية</h3>
            <canvas ref={nationalityBarRef} />
          </section>
        </div>
      </main>
    </Layout>
  );
}
