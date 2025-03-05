export default function DemoPage(): JSX.Element {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            Mapping Documentation Demo
          </h1>
          <a href="/" className="text-blue-600 hover:underline">
            Back to Main
          </a>
        </div>

        <div className="mb-8 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold">Demo Page</h2>
          <p className="mb-4">
            This is the demo page for Informatica Cloud Data Catalog mapping
            upload.
          </p>
          <p className="mb-4">
            The main application with the fully integrated solution is available
            on the home page.
          </p>

          <div className="mt-8 flex items-center justify-center">
            <a
              href="/"
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Go to Main Application
            </a>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            © {new Date().getFullYear()} Informatica Mapping Documentation Tool
          </p>
        </div>
      </div>
    </div>
  );
}
