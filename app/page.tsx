import Header from './components/header';
import UploadForm from './components/upload-form';

export default function Home(): JSX.Element {
  return (
    <div className="container mx-auto px-4 py-8">
      <Header />
      <main className="mt-10">
        <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-900">
          <h2 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Metadata Upload Tool
          </h2>
          <UploadForm />
        </div>
      </main>
      <footer className="mt-10 text-center text-sm text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} IDMC Metadata Upload Tool
      </footer>
    </div>
  );
}
