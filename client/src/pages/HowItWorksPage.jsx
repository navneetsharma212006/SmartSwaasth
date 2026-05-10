import { FiCamera, FiCloud, FiBell, FiCheckCircle, FiSmartphone, FiShield, FiClock, FiDatabase } from "react-icons/fi";

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">How SmartSwaasth Works</h1>
        <p className="text-xl text-black/60">
          Three simple steps to better medication management
        </p>
      </div>

      {/* Steps */}
      <div className="mb-16">
        <div className="space-y-12">
          {/* Step 1 */}
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="w-32 h-32 bg-black text-white rounded-full flex items-center justify-center text-4xl font-bold flex-shrink-0">
              1
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-3 mb-3 justify-center md:justify-start">
                <FiCamera className="text-2xl" />
                <h2 className="text-2xl font-bold">Scan Your Medicine</h2>
              </div>
              <p className="text-black/70 mb-4">
                Use your phone's camera to take a clear photo of your medicine label. 
                Our advanced OCR technology works with curved bottles, strips, and boxes.
              </p>
              <ul className="space-y-2 text-sm text-black/60">
                <li className="flex items-center gap-2">
                  <FiCheckCircle className="text-green-500" /> Works with any medicine label
                </li>
                <li className="flex items-center gap-2">
                  <FiCheckCircle className="text-green-500" /> Supports 50+ languages
                </li>
                <li className="flex items-center gap-2">
                  <FiCheckCircle className="text-green-500" /> Batch scanning available
                </li>
              </ul>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col md:flex-row-reverse gap-6 items-center">
            <div className="w-32 h-32 bg-black text-white rounded-full flex items-center justify-center text-4xl font-bold flex-shrink-0">
              2
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-3 mb-3 justify-center md:justify-start">
                <FiCloud className="text-2xl" />
                <h2 className="text-2xl font-bold">AI Processing</h2>
              </div>
              <p className="text-black/70 mb-4">
                Our AI instantly extracts and verifies medicine name, expiry date, and dosage instructions. 
                It then checks against our medical database for potential interactions.
              </p>
              <ul className="space-y-2 text-sm text-black/60">
                <li className="flex items-center gap-2">
                  <FiCheckCircle className="text-green-500" /> 99% accuracy rate
                </li>
                <li className="flex items-center gap-2">
                  <FiCheckCircle className="text-green-500" /> Real-time interaction checking
                </li>
                <li className="flex items-center gap-2">
                  <FiCheckCircle className="text-green-500" /> Automatic expiry tracking
                </li>
              </ul>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="w-32 h-32 bg-black text-white rounded-full flex items-center justify-center text-4xl font-bold flex-shrink-0">
              3
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-3 mb-3 justify-center md:justify-start">
                <FiBell className="text-2xl" />
                <h2 className="text-2xl font-bold">Stay Safe & On Time</h2>
              </div>
              <p className="text-black/70 mb-4">
                Get intelligent reminders for your medications and instant alerts about potential 
                drug interactions with your existing medicines.
              </p>
              <ul className="space-y-2 text-sm text-black/60">
                <li className="flex items-center gap-2">
                  <FiCheckCircle className="text-green-500" /> Customizable reminder schedules
                </li>
                <li className="flex items-center gap-2">
                  <FiCheckCircle className="text-green-500" /> Push notifications
                </li>
                <li className="flex items-center gap-2">
                  <FiCheckCircle className="text-green-500" /> Interaction severity ratings
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Features Summary */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-center mb-6">Key Features at a Glance</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="text-center p-4 border border-black/10 rounded-lg">
            <FiSmartphone className="text-2xl mx-auto mb-2" />
            <p className="text-sm font-semibold">Mobile Friendly</p>
          </div>
          <div className="text-center p-4 border border-black/10 rounded-lg">
            <FiShield className="text-2xl mx-auto mb-2" />
            <p className="text-sm font-semibold">Secure & Private</p>
          </div>
          <div className="text-center p-4 border border-black/10 rounded-lg">
            <FiClock className="text-2xl mx-auto mb-2" />
            <p className="text-sm font-semibold">Real-time Updates</p>
          </div>
          <div className="text-center p-4 border border-black/10 rounded-lg">
            <FiDatabase className="text-2xl mx-auto mb-2" />
            <p className="text-sm font-semibold">Medical Database</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-black/5 rounded-2xl p-8 text-center">
        <h3 className="text-2xl font-bold mb-3">Ready to get started?</h3>
        <p className="text-black/60 mb-6">Join thousands of users who trust SmartSwaasth</p>
        <button className="bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-black/90">
          Start Scanning Now
        </button>
      </div>
    </div>
  );
}