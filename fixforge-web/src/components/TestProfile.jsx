export function TestProfile() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-2xl mb-4">Grid Test</h1>
      
      {/* FULL WIDTH - Red box (Profile Header simulation) */}
      <div className="w-full bg-red-500 text-white p-8 rounded mb-8">
        <h2>FULL WIDTH HEADER</h2>
        <p>This should span 100% width (like Profile Header)</p>
      </div>

      {/* TWO COLUMNS - Only this section is split 50/50 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="font-bold mb-4">Contribution Stats Area</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-yellow-100 p-4 rounded">Stat 1</div>
            <div className="bg-green-100 p-4 rounded">Stat 2</div>
            <div className="bg-blue-100 p-4 rounded">Stat 3</div>
            <div className="bg-purple-100 p-4 rounded">Stat 4</div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="font-bold mb-4">Tab Content Area</h3>
          <div className="space-y-4">
            <div className="bg-gray-100 p-4 rounded">Tab 1</div>
            <div className="bg-gray-100 p-4 rounded">Tab 2</div>
            <div className="bg-gray-100 p-4 rounded">Tab 3</div>
          </div>
        </div>
      </div>
    </div>
  );
}
