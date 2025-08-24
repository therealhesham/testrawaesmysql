import { useState, useEffect } from 'react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns'; // لتنسيق التاريخ
import { ar } from 'date-fns/locale'; // دعم اللغة العربية
import Navigation from 'components/navigation';
import MessageItem from 'components/MessageItem';
import MessageForm from 'components/MessageForm';
import MessageDetails from 'components/MessageDetails';
import Modal from 'components/modal';
import Style from 'styles/Home.module.css';
import Layout from 'example/containers/Layout';

export default function MessagesPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [messages, setMessages] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalState, setModalState] = useState({ isOpen: false, type: null, data: null });
  const limit = 10;
const [allCount,setAllCount]=useState(0);
const [allInboxCount,setAllInboxCount]=useState(0)
const [allSentCount,setAllSentCount]=useState(0)
const fetchCounter = async ()=>{

try {
  const reponse = await axios.get("/api/messages_counter");
  setAllCount(reponse.data.result)
  setAllInboxCount(reponse.data.inboxCounter)
setAllSentCount(reponse.data.sentCounter)
} catch (error) {
  console.log(error)
}


}


useEffect(()=>{
    fetchCounter()

},[])

  // جلب قائمة المكاتب
  useEffect(() => {
    const fetchOffices = async () => {
      try {
        const response = await axios.get('/api/office_list');
        if (response.data.success) {
          setOffices(response.data.finder);
        }
      } catch (err) {
        setError('فشل في جلب قائمة المكاتب');
      }
    };
    fetchOffices();
  }, []);

  // جلب الرسائل
  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const type = activeTab === 'all' ? '' : activeTab;
        const response = await axios.get(`/api/messages_list`, {
          params: { type, page: currentPage, limit },
        });

        setMessages(response.data.messages || []);
        setTotalPages(response.data.totalPages || 1);
      } catch (err) {
        setError('فشل في جلب الرسائل');
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [activeTab, currentPage]);

  // التحكم في الصفحات
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // فتح المودال
  const openModal = (type, data = null) => {
    setModalState({ isOpen: true, type, data });
  };

  // إغلاق المودال
  const closeModal = () => {
    setModalState({ isOpen: false, type: null, data: null });
  };

  // عدد الرسائل غير المقروءة
  const unreadCount = {
    all: messages.filter((msg) => !msg.isRead).length,
    inbox: messages.filter((msg) => msg.type === 'inbox' && !msg.isRead).length,
    sent: messages.filter((msg) => msg.type === 'sent' && !msg.isRead).length,
  };

  return (
    <Layout>
    <main className={` p-6 flex flex-col gap-16  min-h-screen ${Style['tajawal-regular']}`} dir="rtl">
      <section>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-normal text-[#000000]">سجل المراسلات</h1>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-[#1a4d4f] rounded-md"
            onClick={() => openModal('send-message')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>إرسال رسالة</span>
          </button>
        </div>
        <div className="bg-white border border-[#e0e0e0] rounded-md p-6">
          <nav className="border-b border-[#e0e0e0] mb-6">
            <div className="flex gap-10">
              <a
                href="#"
                className={`pb-3 text-md flex gap-1 items-baseline ${activeTab === 'all' ? 'text-[#1f2937] border-b-2 border-[#1f2937]' : 'text-[#6b7280]'}`}
                onClick={() => setActiveTab('all')}
              >
                الكل <span className={`text-[8px] ${activeTab === 'all' ? 'text-[#1f2937]' : 'text-[#6b7280]'}`}>({allCount})</span>
              </a>
              <a
                href="#"
                className={`pb-3 text-md flex gap-1 items-baseline ${activeTab === 'inbox' ? 'text-[#1f2937] border-b-2 border-[#1f2937]' : 'text-[#6b7280]'}`}
                onClick={() => setActiveTab('inbox')}
              >
                الوارد <span className={`text-[8px] ${activeTab === 'inbox' ? 'text-[#1f2937]' : 'text-[#6b7280]'}`}>({allInboxCount})</span>
              </a>
              <a
                href="#"
                className={`pb-3 text-md flex gap-1 items-baseline ${activeTab === 'sent' ? 'text-[#1f2937] border-b-2 border-[#1f2937]' : 'text-[#6b7280]'}`}
                onClick={() => setActiveTab('sent')}
              >
                الصادر <span className={`text-[8px] ${activeTab === 'sent' ? 'text-[#1f2937]' : 'text-[#6b7280]'}`}>({allSentCount})</span>
              </a>
            </div>
          </nav>
          {loading && <p className="text-center text-[#6b7280]">جاري التحميل...</p>}
          {error && <p className="text-center text-red-500">{error}</p>}
          {!loading && !error && messages.length === 0 && <p className="text-center text-[#6b7280]">لا توجد رسائل</p>}
          <div className="flex flex-col gap-4">
            {messages.map((msg) => (
              <MessageItem
                key={msg.id}
                title={msg.title || 'بدون عنوان'}
                office={`المكتب: ${msg.officeName}`}
                time={formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: ar })}
                isRead={msg.isRead}
                onClick={() => openModal('message-details', msg)}
              />
            ))}
          </div>
          <nav className="flex justify-center gap-1.5 mt-8">
            <a
              href="#"
              className={`px-2 py-0.5 min-w-5 h-4.5 flex items-center justify-center border border-[#e0e0e0] rounded-sm text-md bg-[#f7f8fa] ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              التالي
            </a>
            {[...Array(totalPages)].map((_, i) => (
              <a
                key={i}
                href="#"
                className={`px-2 py-0.5 min-w-5 h-4.5 flex items-center justify-center border rounded-sm text-md ${currentPage === i + 1 ? 'border-[#1a4d4f] bg-[#1a4d4f] text-white' : 'border-[#e0e0e0] bg-[#f7f8fa]'}`}
                onClick={() => handlePageChange(i + 1)}
              >
                {i + 1}
              </a>
            ))}
            <a
              href="#"
              className={`px-2 py-0.5 min-w-5 h-4.5 flex items-center justify-center border border-[#e0e0e0] rounded-sm text-md bg-[#f7f8fa] ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              السابق
            </a>
          </nav>
        </div>
      </section>

      <Modal isOpen={modalState.isOpen} onClose={closeModal}>
        {modalState.type === 'send-message' && (
          <MessageForm title="إرسال رسالة" borderColor="#8a38f5" offices={offices} onClose={closeModal} />
        )}
        {modalState.type === 'message-details' && (
          <MessageDetails message={modalState.data} onClose={closeModal} />
        )}
      </Modal>
    </main>
    </Layout>
  );
}