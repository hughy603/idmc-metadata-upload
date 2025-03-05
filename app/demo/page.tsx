export default function DemoPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Mapping Documentation Demo</h1>
          <a href="/" className="text-blue-600 hover:underline">
            Back to Main
          </a>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Demo Page</h2>
          <p className="mb-4">This is the demo page for Informatica Cloud Data Catalog mapping upload.</p>
          <p className="mb-4">The main application with the fully integrated solution is available on the home page.</p>
          
          <div className="flex items-center justify-center mt-8">
            <a href="/" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Go to Main Application
            </a>
          </div>
        </div>
        
        <div className="mt-8 text-sm text-gray-500 text-center">
          <p>© {new Date().getFullYear()} Informatica Mapping Documentation Tool</p>
        </div>
      </div>
    </div>
  )
} 