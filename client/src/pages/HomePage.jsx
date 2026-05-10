import { Link } from "react-router-dom";
import { 
  FiShield, 
  FiCamera, 
  FiClock, 
  FiAlertTriangle, 
  FiArrowRight, 
  FiCheckCircle,
  FiDatabase,
  FiBell,
  FiUsers,
  FiStar,
  FiTrendingUp,
  FiLock,
  FiCloud,
  FiHome,
  FiActivity,
  FiMapPin,
  FiPhone,
  FiMail,
  FiTwitter,
  FiGithub,
  FiLinkedin
} from "react-icons/fi";
import { FaHospital, FaPills, FaTruck, FaUserMd } from "react-icons/fa";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl">
      {/* Hero Section with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-black to-gray-800 text-white mb-16">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        
        <div className="relative px-8 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-6 backdrop-blur-sm">
            <FiStar className="text-yellow-400" />
            <span className="text-sm font-medium">Trusted by 10,000+ users</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Your Smart Medication
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
              Manager
            </span>
          </h1>
          
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10">
            Track expiry dates, check drug interactions, and never miss a dose with AI-powered medication management
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/scan"
              className="inline-flex items-center justify-center gap-2 bg-white text-black px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-100 transition-all transform hover:scale-105"
            >
              <FiCamera className="text-xl" /> Start Free Trial
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-2 border border-white/30 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white/10 transition-all"
            >
              View Demo <FiArrowRight />
            </Link>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 mt-12 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <FiCheckCircle className="text-green-400" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <FiCheckCircle className="text-green-400" />
              <span>Free 30-day trial</span>
            </div>
            <div className="flex items-center gap-2">
              <FiCheckCircle className="text-green-400" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trusted By Section */}
      <div className="py-12 border-t border-b border-black/10 mb-16">
        <p className="text-center text-black/60 mb-6">Trusted by healthcare professionals and patients worldwide</p>
        <div className="flex flex-wrap justify-center items-center gap-12 opacity-50">
          <div className="flex items-center gap-2 text-xl font-semibold">
            <FaHospital className="text-2xl" />
            <span>City Hospital</span>
          </div>
          <div className="flex items-center gap-2 text-xl font-semibold">
            <FaPills className="text-2xl" />
            <span>PharmaCare</span>
          </div>
          <div className="flex items-center gap-2 text-xl font-semibold">
            <FaTruck className="text-2xl" />
            <span>MedExpress</span>
          </div>
          <div className="flex items-center gap-2 text-xl font-semibold">
            <FaUserMd className="text-2xl" />
            <span>HealthNet</span>
          </div>
        </div>
      </div>

      {/* Features Section with Cards */}
      <div className="mb-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
          <p className="text-xl text-black/60 max-w-2xl mx-auto">
            Everything you need to manage your medications effectively
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="group p-8 rounded-2xl border border-black/10 hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="bg-black/5 rounded-full w-16 h-16 flex items-center justify-center mb-5 group-hover:bg-black group-hover:text-white transition-colors">
              <FiCamera className="text-2xl" />
            </div>
            <h3 className="text-xl font-bold mb-3">Smart Scan</h3>
            <p className="text-black/60 mb-4">
              Advanced OCR technology extracts medicine name, expiry date, and dosage from any label instantly
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-black/60">
                <FiCheckCircle className="text-green-500 text-xs" /> 99% accuracy rate
              </li>
              <li className="flex items-center gap-2 text-black/60">
                <FiCheckCircle className="text-green-500 text-xs" /> Supports 50+ languages
              </li>
              <li className="flex items-center gap-2 text-black/60">
                <FiCheckCircle className="text-green-500 text-xs" /> Batch scanning available
              </li>
            </ul>
          </div>
          
          <div className="group p-8 rounded-2xl border border-black/10 hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="bg-black/5 rounded-full w-16 h-16 flex items-center justify-center mb-5 group-hover:bg-black group-hover:text-white transition-colors">
              <FiDatabase className="text-2xl" />
            </div>
            <h3 className="text-xl font-bold mb-3">Interaction Checker</h3>
            <p className="text-black/60 mb-4">
              Automatically check for dangerous drug interactions using comprehensive medical databases
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-black/60">
                <FiCheckCircle className="text-green-500 text-xs" /> 500,000+ drug interactions
              </li>
              <li className="flex items-center gap-2 text-black/60">
                <FiCheckCircle className="text-green-500 text-xs" /> Real-time alerts
              </li>
              <li className="flex items-center gap-2 text-black/60">
                <FiCheckCircle className="text-green-500 text-xs" /> Severity ratings
              </li>
            </ul>
          </div>
          
          <div className="group p-8 rounded-2xl border border-black/10 hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="bg-black/5 rounded-full w-16 h-16 flex items-center justify-center mb-5 group-hover:bg-black group-hover:text-white transition-colors">
              <FiBell className="text-2xl" />
            </div>
            <h3 className="text-xl font-bold mb-3">Smart Reminders</h3>
            <p className="text-black/60 mb-4">
              Never miss a dose with intelligent push notifications and scheduling
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-black/60">
                <FiCheckCircle className="text-green-500 text-xs" /> Customizable schedules
              </li>
              <li className="flex items-center gap-2 text-black/60">
                <FiCheckCircle className="text-green-500 text-xs" /> Push notifications
              </li>
              <li className="flex items-center gap-2 text-black/60">
                <FiCheckCircle className="text-green-500 text-xs" /> Refill reminders
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* How It Works Section with Timeline */}
      <div className="mb-16 bg-black/5 rounded-2xl p-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-xl text-black/60 max-w-2xl mx-auto">
            Three simple steps to better medication management
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="text-center relative">
            <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4 relative z-10">
              1
            </div>
            <div className="absolute top-10 left-1/2 w-full h-0.5 bg-black/10 hidden md:block"></div>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <FiCamera className="text-3xl mx-auto mb-3" />
              <h3 className="text-lg font-bold mb-2">Scan Label</h3>
              <p className="text-black/60 text-sm">Take a photo of your medicine label using your camera</p>
            </div>
          </div>
          
          <div className="text-center relative">
            <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4 relative z-10">
              2
            </div>
            <div className="absolute top-10 left-1/2 w-full h-0.5 bg-black/10 hidden md:block"></div>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <FiCloud className="text-3xl mx-auto mb-3" />
              <h3 className="text-lg font-bold mb-2">AI Processing</h3>
              <p className="text-black/60 text-sm">Our AI extracts and verifies all medication information</p>
            </div>
          </div>
          
          <div className="text-center">
            <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">
              3
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <FiBell className="text-3xl mx-auto mb-3" />
              <h3 className="text-lg font-bold mb-2">Stay Safe</h3>
              <p className="text-black/60 text-sm">Get reminders and interaction alerts automatically</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="mb-16">
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center p-6 border border-black/10 rounded-xl">
            <div className="text-4xl font-bold text-black mb-2">50K+</div>
            <div className="text-black/60">Active Users</div>
            <FiUsers className="mx-auto mt-2 text-black/30" />
          </div>
          <div className="text-center p-6 border border-black/10 rounded-xl">
            <div className="text-4xl font-bold text-black mb-2">1M+</div>
            <div className="text-black/60">Scans Completed</div>
            <FiTrendingUp className="mx-auto mt-2 text-black/30" />
          </div>
          <div className="text-center p-6 border border-black/10 rounded-xl">
            <div className="text-4xl font-bold text-black mb-2">500K+</div>
            <div className="text-black/60">Interactions Prevented</div>
            <FiShield className="mx-auto mt-2 text-black/30" />
          </div>
          <div className="text-center p-6 border border-black/10 rounded-xl">
            <div className="text-4xl font-bold text-black mb-2">4.9</div>
            <div className="text-black/60">App Store Rating</div>
            <FiStar className="mx-auto mt-2 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">What Our Users Say</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 border border-black/10 rounded-xl">
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, i) => <FiStar key={i} className="text-yellow-500" />)}
            </div>
            <p className="text-black/80 mb-4">
              "SmartSwaasth has completely changed how I manage my medications. The interaction checker saved me from a dangerous combination!"
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black/10 rounded-full flex items-center justify-center">
                <FiUsers />
              </div>
              <div>
                <p className="font-semibold">Hityesha</p>
                <p className="text-sm text-black/60">Patient</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 border border-black/10 rounded-xl">
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, i) => <FiStar key={i} className="text-yellow-500" />)}
            </div>
            <p className="text-black/80 mb-4">
              "As a caregiver for elderly parents, this app is a lifesaver. The reminder system ensures they never miss their medication."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black/10 rounded-full flex items-center justify-center">
                <FiUsers />
              </div>
              <div>
                <p className="font-semibold">Navneet Sharma</p>
                <p className="text-sm text-black/60">Caregiver</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 border border-black/10 rounded-xl">
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, i) => <FiStar key={i} className="text-yellow-500" />)}
            </div>
            <p className="text-black/80 mb-4">
              "The OCR technology is incredibly accurate. It saves me hours of manual data entry. Highly recommended!"
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black/10 rounded-full flex items-center justify-center">
                <FiUsers />
              </div>
              <div>
                <p className="font-semibold">Aparas Kushwaha</p>
                <p className="text-sm text-black/60">Pharmacist</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="mb-16 bg-gradient-to-r from-black to-gray-800 rounded-2xl p-12 text-white text-center">
        <FiLock className="text-5xl mx-auto mb-4" />
        <h2 className="text-3xl font-bold mb-4">Your Data is Safe With Us</h2>
        <p className="text-gray-300 max-w-2xl mx-auto mb-6">
          We use bank-level encryption to protect your medical information. Never shared with third parties.
        </p>
        <div className="flex flex-wrap justify-center gap-6 text-sm">
          <span className="flex items-center gap-1">✓ HIPAA Compliant</span>
          <span className="flex items-center gap-1">✓ GDPR Ready</span>
          <span className="flex items-center gap-1">✓ End-to-End Encryption</span>
          <span className="flex items-center gap-1">✓ 24/7 Monitoring</span>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="text-center py-16">
        <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-xl text-black/60 mb-8 max-w-2xl mx-auto">
          Join thousands of users who trust SmartSwaasth for their medication management
        </p>
        <Link
          to="/scan"
          className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-black/90 transition-all transform hover:scale-105"
        >
          Start Your Free Trial <FiArrowRight />
        </Link>
        <p className="text-sm text-black/40 mt-4">No credit card required • Free forever plan available</p>
      </div>
    </div>
  );
}