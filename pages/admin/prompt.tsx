import { useState } from 'react';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResponse('');

    try {
      const res = await fetch('http://localhost:4000/prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: prompt }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log(data)
      setResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('Failed to fetch:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <title>AI Prompt Interface</title>

      <main className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          AI Prompt Interface
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">
              Enter Your Prompt
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="mt-1 w-full h-32 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type your prompt here..."
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !prompt}
            className={`w-full py-2 px-4 rounded-md text-white font-semibold ${
              isLoading || !prompt ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            } transition-colors`}
          >
            {isLoading ? 'Processing...' : 'Submit Prompt'}
          </button>
        </form>

        {error && (
          <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            <h2 className="text-lg font-semibold">Error:</h2>
            <p className="mt-2">{error}</p>
          </div>
        )}

        {response && (
          <div className="mt-6 p-4 bg-gray-50 rounded-md overflow-x-auto">
            <h2 className="text-lg font-semibold text-gray-800">AI Response:</h2>
            <pre className="mt-2 text-gray-600 whitespace-pre-wrap">{response}</pre>
          </div>
        )}
      </main>

      <footer className="mt-8 text-gray-500">
        {/* <p>Built with Next.js and Tailwind CSS</p> */}
      </footer>
    </div>
  );
}
