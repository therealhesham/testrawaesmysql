import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from 'example/containers/Layout';
import { jwtDecode } from 'jwt-decode';

export default function Home() {
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState(null);
  const [offices, setOffices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  async function fetchOffices() {
    try {
      const fetcher = await fetch("/api/office_list");
      const data = await fetcher.json();
      setOffices(data);
    } catch (error) {
      console.error("Failed to fetch offices:", error);
    }
  }

  useEffect(() => {
    fetchOffices();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const decoder = token ? jwtDecode(token) : null;
      if (!decoder) {
        throw new Error("Invalid token");
      }
      const res = await fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient, message, sender: decoder.username }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ type: 'success', message: 'Message sent successfully!' });
        setRecipient('');
        setMessage('');
      } else {
        setStatus({ type: 'error', message: data.error });
      }
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: 'Failed to send message' });
    } finally {
      setIsLoading(false);
    }
  };

  // Animation variants
  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.4 } },
  };

  const inputVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: (i) => ({
      x: 0,
      opacity: 1,
      transition: { delay: i * 0.2, duration: 0.5, ease: "easeOut" },
    }),
  };

  const buttonVariants = {
    hover: { scale: 1.05, boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.2)" },
    tap: { scale: 0.98 },
  };

  const statusVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100"
          variants={formVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center tracking-tight">
            Send Message to Office
          </h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div variants={inputVariants} custom={0}>
              <label
                htmlFor="recipient"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Office
              </label>
              <select
                id="recipient"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition duration-200"
                required
                aria-required="true"
              >
                <option value="">Select an office</option>
                {offices?.finder?.map((e, index) => (
                  <option key={index} value={e?.office}>
                    {e?.office}
                  </option>
                ))}
              </select>
            </motion.div>
            <motion.div variants={inputVariants} custom={1}>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Message
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition duration-200 resize-none"
                rows={5}
                required
                aria-required="true"
              />
            </motion.div>
            <motion.button
              type="submit"
              className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              disabled={isLoading}
              aria-disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <span>Send Message</span>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    ></path>
                  </svg>
                </>
              )}
            </motion.button>
          </form>
          <AnimatePresence>
            {status && (
              <motion.div
                className={`mt-6 p-4 rounded-lg flex items-center space-x-2 ${
                  status.type === 'success'
                    ? 'bg-green-50 text-green-800'
                    : 'bg-red-50 text-red-800'
                }`}
                variants={statusVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                role="alert"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {status.type === 'success' ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  )}
                </svg>
                <span>{status.message}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </Layout>
  );
}