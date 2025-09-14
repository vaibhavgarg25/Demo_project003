import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-text mb-2">Kochi Metro</h1>
          <h2 className="text-xl text-muted mb-8">Fleet Induction Dashboard</h2>
          <p className="text-muted mb-8">Professional fleet management system for Kochi Metro operations.</p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 dark:focus:ring-white"
          >
            Access Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
