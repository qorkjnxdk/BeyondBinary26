'use client';

import Link from "next/link";

export default function Home() {

  const features = [
    {
      icon: "💬",
      title: "24/7 Support Chat",
      description: "Connect with trained support specialists anytime, day or night. You're never alone.",
      color: "from-primary-400 to-primary-500",
      linkColor: "text-primary-600",
    },
    {
      icon: "👥",
      title: "Mother Community",
      description: "Join supportive groups with mothers at the same stage. Share experiences and grow together.",
      color: "from-accent-400 to-accent-500",
      linkColor: "text-accent-600",
    },
    {
      icon: "📚",
      title: "Expert Resources",
      description: "Access evidence-based articles, videos, and guides from healthcare professionals.",
      color: "from-orange-400 to-orange-500",
      linkColor: "text-orange-600",
    },
    {
      icon: "📊",
      title: "Mood Tracking",
      description: "Monitor your emotional wellbeing with daily check-ins and personalized insights.",
      color: "from-blue-400 to-blue-500",
      linkColor: "text-blue-600",
    },
    {
      icon: "🌿",
      title: "Self-Care Tools",
      description: "Guided meditations, breathing exercises, and wellness activities designed for new mothers.",
      color: "from-green-400 to-green-500",
      linkColor: "text-green-600",
    },
    {
      icon: "⭐",
      title: "Milestone Tracking",
      description: "Track your baby's development and celebrate every precious moment together.",
      color: "from-yellow-400 to-yellow-500",
      linkColor: "text-yellow-600",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Mitchell",
      role: "First-time mother",
      quote: "This platform has been a lifeline during my postpartum journey. The support and community I found here made all the difference.",
      stars: 5,
    },
    {
      name: "Jessica Chen",
      role: "Mother of two",
      quote: "The community feature is incredible. I've connected with so many amazing mothers who understand exactly what I'm going through.",
      stars: 5,
    },
    {
      name: "Amanda Rodriguez",
      role: "New mother",
      quote: "The expert guidance and mood tracking helped me navigate the challenging early months with confidence and support.",
      stars: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative pt-6 pb-8 px-4 overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary-50/30 via-white to-white"></div>
        
        {/* Decorative blobs */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-4 items-center">
            {/* Left: Text Content */}
            <div className="text-center">
              <p className="text-xs font-medium text-primary-500 mb-2 tracking-wide uppercase">
                Your Postpartum Companion
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-primary-900 mb-2 leading-tight">
                You're Not Alone on This Journey
              </h1>
              <p className="text-sm text-primary-700 mb-4 leading-relaxed max-w-xl mx-auto">
                Harbour is your caring companion through the beautiful, challenging postpartum period. Get personalized support, connect with other mothers, and access expert guidance—all in one nurturing space.
              </p>
              
              {/* CTA Buttons - Centered */}
              <div className="flex flex-col sm:flex-row gap-2 mb-4 justify-center">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center justify-center px-4 py-2 text-sm bg-gradient-to-r from-primary-500 to-accent-500 text-white font-medium rounded-lg shadow-md hover:shadow-lg hover:from-primary-600 hover:to-accent-600 transition-all duration-200"
                >
                  Start Your Journey
                  <svg className="ml-1.5 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center justify-center px-4 py-2 text-sm bg-white text-primary-600 font-medium rounded-lg border-2 border-primary-200 hover:border-primary-400 hover:bg-primary-50 transition-all duration-200"
                >
                  Log In
                </Link>
                <Link
                  href="#features"
                  className="inline-flex items-center justify-center px-4 py-2 text-sm bg-white text-primary-600 font-medium rounded-lg border-2 border-primary-200 hover:border-primary-400 hover:bg-primary-50 transition-all duration-200"
                >
                  Learn More
                </Link>
              </div>
              
              {/* Social Proof */}
              <div className="flex items-center justify-center gap-3">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-400 to-accent-400 border-2 border-white"></div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-accent-400 to-primary-400 border-2 border-white"></div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 border-2 border-white"></div>
                </div>
                <p className="text-xs text-primary-600 font-medium">10,000+ mothers supported</p>
              </div>
            </div>
            
            {/* Right: Visual Card */}
            <div className="relative">
              <div className="bg-white rounded-xl shadow-lg border border-primary-100 p-3 overflow-hidden">
                <div className="aspect-[4/3] rounded-lg mb-2 overflow-hidden">
                  <img 
                    src="/mother.jpg" 
                    alt="Mother and baby" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-center justify-between p-2 bg-primary-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">😊</span>
                    <div>
                      <p className="text-xs text-primary-600 font-medium">Today's Mood Check</p>
                      <p className="text-xs text-primary-900 font-semibold">Feeling Good</p>
                    </div>
                  </div>
                  <span className="text-lg">💜</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-6 px-4 bg-gradient-to-b from-white to-primary-50/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-4">
            <h2 className="text-xl md:text-2xl font-bold text-primary-900 mb-1">
              Everything You Need
            </h2>
            <p className="text-xs text-primary-700 max-w-2xl mx-auto">
              Comprehensive support tailored to your postpartum journey
            </p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-primary-100 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center text-base mb-2 shadow-sm`}>
                  {feature.icon}
                </div>
                <h3 className="text-sm font-bold text-primary-900 mb-1">{feature.title}</h3>
                <p className="text-xs text-primary-700 mb-2 leading-relaxed line-clamp-2">{feature.description}</p>
                <Link href="/auth/signup" className={`text-xs font-medium ${feature.linkColor} hover:underline inline-flex items-center gap-1`}>
                  Learn more
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-6 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-4">
            <h2 className="text-xl md:text-2xl font-bold text-primary-900 mb-1">
              Stories from Our Community
            </h2>
            <p className="text-xs text-primary-700 max-w-2xl mx-auto">
              Real experiences from mothers who found support and connection
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-3">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-primary-50/50 to-accent-50/50 backdrop-blur-sm rounded-lg p-3 border border-primary-100 shadow-sm"
              >
                <div className="flex gap-0.5 mb-2">
                  {[...Array(testimonial.stars)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xs">⭐</span>
                  ))}
                </div>
                <p className="text-primary-800 mb-2 leading-relaxed italic text-xs line-clamp-3">
                  "{testimonial.quote}"
                </p>
                <div>
                  <p className="font-bold text-primary-900 text-xs">{testimonial.name}</p>
                  <p className="text-xs text-primary-600">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-6 px-4 bg-gradient-to-r from-primary-500 via-accent-500 to-primary-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
            Begin Your Supported Journey Today
          </h2>
          <p className="text-xs text-white/90 mb-4 max-w-2xl mx-auto">
            Join thousands of mothers who found comfort, support, and community during their postpartum journey.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-2 justify-center mb-3">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center px-4 py-2 text-sm bg-white text-primary-600 font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Get Started Free
              <svg className="ml-1.5 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center px-4 py-2 text-sm bg-transparent text-white font-medium rounded-lg border-2 border-white/30 hover:border-white/50 transition-all duration-200"
            >
              Schedule a Demo
            </Link>
          </div>
          
          <p className="text-xs text-white/80">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary-900 text-white py-4 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Logo & Tagline - Centered */}
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-lg">💜</span>
              <h3 className="text-lg font-bold">Harbour</h3>
            </div>
            <p className="text-primary-200 text-xs leading-relaxed max-w-2xl mx-auto">
              Your trusted companion through the postpartum journey. Supporting mothers with care, compassion, and community.
            </p>
          </div>
          
          {/* Social Media & Copyright */}
          <div className="border-t border-primary-800 pt-4 flex flex-col md:flex-row justify-center items-center gap-3">
            <p className="text-xs text-primary-300">
              © 2024 Harbour. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="text-primary-300 hover:text-white transition">
                <span className="sr-only">Facebook</span>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </Link>
              <Link href="#" className="text-primary-300 hover:text-white transition">
                <span className="sr-only">Instagram</span>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.315 2c2.43 0 2.78.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"/>
                </svg>
              </Link>
              <Link href="#" className="text-primary-300 hover:text-white transition">
                <span className="sr-only">Twitter</span>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"/>
                </svg>
              </Link>
              <Link href="#" className="text-primary-300 hover:text-white transition">
                <span className="sr-only">LinkedIn</span>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </Link>
            </div>
          </div>
          
          <div className="border-t border-primary-800 pt-3 mt-3 flex flex-col md:flex-row justify-center items-center gap-3 text-xs text-primary-300">
            <div className="flex gap-4">
              <Link href="#" className="hover:text-white transition">Privacy Policy</Link>
              <Link href="#" className="hover:text-white transition">Terms of Service</Link>
              <Link href="#" className="hover:text-white transition">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
