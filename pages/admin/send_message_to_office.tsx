import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from 'example/containers/Layout';
import { jwtDecode } from 'jwt-decode';

export default function Home() {
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState(null);
const [offices,setOffices]=useState([])
  async function office() {
   const fetcher =  await fetch("/api/office_list")
   const data = await fetcher.json()
 setOffices(data) }
useEffect(()=>{


office()
},[])
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);

    try {
const token =      localStorage.getItem("token")
const decoder = token ? jwtDecode(token) : null;
if (!decoder) {
  throw new Error("Invalid token");
}
      const res = await fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient, message ,sender:decoder.username})
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ type: 'sent', message: 'Message sent!' });
        setRecipient('');
        setMessage('');
      } else {
        setStatus({ type: 'error', message: data.error });
      }
    } catch (error) {
      console.log(error)
      setStatus({ type: 'error', message: 'Failed to send message' });
    }
  };

  // Animation variants
  const formVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } },
    exit: { opacity: 0, transition: { duration: 0.3 } },
  };

  const inputVariants = {
    hidden: { x: -100, opacity: 0 },
    visible: (i) => ({
      x: 0,
      opacity: 1,
      transition: { delay: i * 0.2, duration: 0.4 },
    }),
  };

  const buttonVariants = {
    hover: { scale: 1.1, transition: { duration: 0.2 } },
    tap: { scale: 0.95 },
  };

  const statusVariants = {
    hidden: { opacity: 0, rotate: 0 },
    visible: { opacity: 1, rotate: 360, transition: { duration: 0.5 } },
  };

  return (
    <Layout>
    <div className="min-h-screen bg-gray-100  flex items-center justify-center p-4">
      <motion.div
        className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md"
        variants={formVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <h1 className="text-2xl font-bold mb-4 text-center">Send Message to Office</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div variants={inputVariants} custom={0}>
            <label htmlFor="recipient" className="block text-sm font-medium">
              Office
            </label>
            <select
              id="recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="">Select an office</option>
              
              {offices?.finder?.map(e=><option>{e?.office}</option>)}
            </select>
          </motion.div>
          <motion.div variants={inputVariants} custom={1}>
            <label htmlFor="message" className="block text-sm font-medium">
              Message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              rows={4}
              required
            />
          </motion.div>
          <motion.button
            type="submit"
            className="w-full bg-[#1a4d4f] text-white py-2 px-4 rounded-md "
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            Send Message
          </motion.button>
        </form>
        <AnimatePresence>
          {status && (
            <motion.div
              className={`mt-4 p-3 rounded-md ${
                status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              } flex items-center`}
              variants={statusVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <span className="mr-2">📬</span>
              {status.message}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
 </Layout>
  );
}