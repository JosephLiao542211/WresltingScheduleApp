import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-6">Welcome to Class Scheduler</h1>
        <p className="text-xl mb-8">The simplest way to sign up for classes</p>
        
        <div className="space-x-4">
          <Link
            href="/auth/login"
            className="inline-block rounded-md bg-indigo-600 px-6 py-3 text-white font-medium hover:bg-indigo-500"
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="inline-block rounded-md bg-white px-6 py-3 text-indigo-600 font-medium border border-indigo-600 hover:bg-gray-50"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
