export default function InfoCard({ title, data, gridCols = 1, actions = [] }) {
  return (
    <section className="bg-gray-100 border border-gray-200 rounded-md p-6 mb-6">
      <h3 className="text-2xl font-normal text-center mb-6">{title}</h3>
      <div className={`grid grid-cols-${gridCols} gap-4`}>
        {data.map((item, index) => (
          <div key={index} className="flex flex-col gap-2">
            <label className="text-base text-right">{item.label}</label>
            <div className="bg-gray-200 border border-gray-300 rounded-md p-2 text-base text-right">{item.value}</div>
          </div>
        ))}
      </div>
      {actions.length > 0 && (
        <div className="flex gap-4 mt-6 justify-start">
          {actions.map((action, index) => (
            <button
              key={index}
              className={action.type === 'primary' ? 'bg-teal-800 text-white px-4 py-2 rounded-md text-sm' : 'border border-teal-800 text-teal-800 px-4 py-2 rounded-md text-sm'}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}