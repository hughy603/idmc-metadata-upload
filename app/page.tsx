import Header from './components/header'
import UploadForm from './components/upload-form'

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Header />
      <main className="mt-10">
        <div className="bg-white dark:bg-gray-900 shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-gray-100">Metadata Upload Tool</h2>
          <UploadForm />
        </div>
      </main>
      <footer className="mt-10 text-center text-gray-500 dark:text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} IDMC Metadata Upload Tool
      </footer>
    </div>
  )
} 