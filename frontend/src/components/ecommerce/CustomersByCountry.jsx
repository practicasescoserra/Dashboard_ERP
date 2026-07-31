export default function CustomersByCountry({ data }) {
  const maxCount = Math.max(...data.map((d) => d.customer_count), 1);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">Clientes por país</h3>
      <div className="space-y-4">
        {data.map((item) => (
          <div key={item.country}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300">{item.country}</span>
              <span className="text-gray-500 dark:text-gray-400">{item.customer_count}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className="h-2 rounded-full bg-brand-500"
                style={{ width: `${(item.customer_count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}