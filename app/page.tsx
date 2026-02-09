import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="max-w-md w-full mx-4 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Beyond Binary
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          A safe space for women in Singapore to connect anonymously
        </p>
        <div className="space-y-4">
          <Link
            href="/auth/signup"
            className="block w-full bg-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-pink-700 transition"
          >
            Sign Up
          </Link>
          <Link
            href="/auth/login"
            className="block w-full bg-white text-pink-600 py-3 px-6 rounded-lg font-semibold border-2 border-pink-600 hover:bg-pink-50 transition"
          >
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}

