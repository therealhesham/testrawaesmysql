export default function MessageItem({ title, office, time, isRead, onClick }) {
  return (
    <article className={`flex justify-between items-center p-4 border border-[#1a4d4f] rounded-md bg-[#1a4d4f05] shadow-sm ${isRead ? '' : 'bg-[#1a4d4f10]'}`}>
      <div className="flex flex-col gap-2 items-start">
        <h2 className="text-sm font-bold text-[#1f2937]">{title}</h2>
        <p className="text-sm text-[#6b7280]">{office}</p>
        <div className="flex items-center gap-1 text-md text-[#6b7280]">
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{time}</span>
        </div>
      </div>
      <button
        className="px-8 py-1 text-sm text-[#030901] border border-[#1a4d4f] rounded-md hover:bg-[#1a4d4f] hover:text-white transition-colors"
        onClick={onClick}
      >
        عرض
      </button>
    </article>
  );
}