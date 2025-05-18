import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from 'example/containers/Layout';

export default function Messages() {
  const [activeTab, setActiveTab] = useState('inbox');
  const [messages, setMessages] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Replace with actual officeName from auth context or props
  const officeName = 'exampleOffice';

  useEffect(() => {
    fetchMessages();
  }, [activeTab, page]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/messages_list?officeName=${officeName}&type=${activeTab }&page=${page}&limit=10`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
        setTotalPages(data.pages);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
    setLoading(false);
  };

  return (
    <Layout>
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Office Messages</title>
        <meta name="description" content="View sent and inbox messages" />
      </Head>

      <main className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Office Messages</h1>

        {/* Tabs */}
        <div className="mb-4">
          <button
            className={`px-4 py-2 mr-2 rounded ${activeTab === 'inbox' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => { setActiveTab('inbox'); setPage(1); }}
          >
            sent
          </button>
          <button
            className={`px-4 py-2 rounded ${activeTab === 'sent' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => { setActiveTab('sent'); setPage(1); }}
          >
            inbox
          </button>
        </div>

        {/* Messages List */}
        {loading ? (
          <p>Loading...</p>
        ) : messages.length === 0 ? (
          <p>No messages found.</p>
        ) : (
          <div className="bg-white shadow rounded-lg">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`p-4 border-b ${message.isRead ? 'bg-gray-50' : 'bg-white'}`}
              >
                <div className="flex justify-between">
                  <div>
                    <h2 className="text-lg font-semibold"><span className='text-xl'>{message.title}</span></h2>
                    <p className="text-xl text-gray-600"> {activeTab =="inbox"?"to":"From"} <span className='text-xl text-blue-800' >{message.officeName}</span></p>
                    <p className="text-gray-700">{message.message.slice(0, 100)}...</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(message.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-4">
            <button
              className="px-4 py-2 mx-1 bg-gray-200 rounded disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <span className="px-4 py-2">Page {page} of {totalPages}</span>
            <button
              className="px-4 py-2 mx-1 bg-gray-200 rounded disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
    </Layout>
  );
}