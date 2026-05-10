import { FiShield, FiUsers, FiTarget, FiAward, FiHeart, FiClock, FiGlobe, FiTrendingUp } from "react-icons/fi";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">About SmartSwaasth</h1>
        <p className="text-xl text-black/60">
          We're on a mission to make medication management safer and simpler for everyone
        </p>
      </div>

      {/* Mission Section */}
      <div className="mb-12 bg-black/5 rounded-2xl p-8 text-center">
        <FiTarget className="text-5xl mx-auto mb-4 text-black" />
        <h2 className="text-2xl font-bold mb-3">Our Mission</h2>
        <p className="text-black/70 leading-relaxed max-w-2xl mx-auto">
          To empower individuals and families with intelligent tools that prevent medication errors, 
          track expirations, and provide peace of mind through advanced technology.
        </p>
      </div>

      {/* Story Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Our Story</h2>
        <div className="space-y-4 text-black/70 leading-relaxed">
          <p>
            SmartSwaasth was founded in 2023 by a team of healthcare professionals and technologists who 
            recognized a critical gap in medication management. After witnessing loved ones struggle 
            with tracking multiple prescriptions and nearly experiencing dangerous drug interactions, 
            they decided to create a solution.
          </p>
          <p>
            What started as a simple expiry tracker has grown into a comprehensive medication 
            management platform that uses cutting-edge OCR technology and medical databases to 
            keep patients safe.
          </p>
          <p>
            Today, SmartSwaasth helps thousands of users worldwide manage their medications confidently, 
            preventing potentially harmful drug interactions and ensuring they never miss a dose.
          </p>
        </div>
      </div>

      {/* Values Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-center">Our Core Values</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center p-6 border border-black/10 rounded-xl">
            <FiShield className="text-3xl mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Safety First</h3>
            <p className="text-sm text-black/60">User safety is our top priority in every decision</p>
          </div>
          <div className="text-center p-6 border border-black/10 rounded-xl">
            <FiHeart className="text-3xl mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Compassion</h3>
            <p className="text-sm text-black/60">We care deeply about improving healthcare outcomes</p>
          </div>
          <div className="text-center p-6 border border-black/10 rounded-xl">
            <FiTrendingUp className="text-3xl mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Innovation</h3>
            <p className="text-sm text-black/60">Continuously improving with latest technology</p>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-center">Meet Our Team</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-32 h-32 bg-black/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <FiUsers className="text-4xl" />
            </div>
            <h3 className="font-semibold">Deepak Mangal</h3>
            <p className="text-sm text-black/60">Frontend Developer</p>
          </div>

          <div className="text-center">
            <div className="w-32 h-32 bg-black/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <FiUsers className="text-4xl" />
            </div>
            <h3 className="font-semibold">Hityesha Choudhary</h3>
            <p className="text-sm text-black/60">Team leader & Product Integrator</p>
          </div>


          <div className="text-center">
            <div className="w-32 h-32 bg-black/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <FiUsers className="text-4xl" />
            </div>
            <h3 className="font-semibold">Aparas Kushwaha</h3>
            <p className="text-sm text-black/60">Backend Developer</p>
          </div>

          <div className="text-center">
            <div className="w-32 h-32 bg-black/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <FiUsers className="text-4xl" />
            </div>
            <h3 className="font-semibold">Kush Verma</h3>
            <p className="text-sm text-black/60">Database Manager</p>
          </div>

          <div className="text-center">
            <div className="w-32 h-32 bg-black/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <FiUsers className="text-4xl" />
            </div>
            <h3 className="font-semibold">Navneet Sharma</h3>
            <p className="text-sm text-black/60">Backend Developer</p>
          </div>

          <div className="text-center">
            <div className="w-32 h-32 bg-black/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <FiUsers className="text-4xl" />
            </div>
            <h3 className="font-semibold">Rishika Farkya</h3>
            <p className="text-sm text-black/60">Research Analyst</p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-black text-white rounded-2xl p-8">
        <div className="grid md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold mb-1">50K+</div>
            <div className="text-sm text-gray-300">Active Users</div>
          </div>
          <div>
            <div className="text-3xl font-bold mb-1">1M+</div>
            <div className="text-sm text-gray-300">Scans Completed</div>
          </div>
          <div>
            <div className="text-3xl font-bold mb-1">500+</div>
            <div className="text-sm text-gray-300">Medications Tracked</div>
          </div>
          <div>
            <div className="text-3xl font-bold mb-1">4.9</div>
            <div className="text-sm text-gray-300">User Rating</div>
          </div>
        </div>
      </div>
    </div>
  );
}