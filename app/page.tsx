import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center gradient-soft relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 right-0 w-72 h-72 bg-accent-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-primary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      
      <div className="max-w-md w-full mx-4 text-center relative z-10">
        <div className="mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent mb-4">
            Beyond Binary
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-primary-500 to-accent-500 mx-auto rounded-full mb-6"></div>
          <p className="text-xl text-gray-700 font-medium leading-relaxed">
            A safe space for women in Singapore to connect anonymously
          </p>
        </div>
        
        <div className="space-y-4 mt-10">
          <Link
            href="/auth/signup"
            className="btn-primary block w-full text-center"
          >
            Get Started
          </Link>
          <Link
            href="/auth/login"
            className="btn-secondary block w-full text-center"
          >
            Sign In
          </Link>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Verified • Safe • Anonymous
          </p>
        </div>
      </div>
    </div>
  );
}

