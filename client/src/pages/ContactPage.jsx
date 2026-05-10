import { useState } from "react";
import { FiMail, FiPhone, FiMapPin, FiSend, FiCheckCircle, FiClock, FiMessageSquare } from "react-icons/fi";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission here
    console.log("Form submitted:", formData);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
        <p className="text-xl text-black/60">
          We'd love to hear from you. Send us a message and we'll respond within 24 hours.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Contact Information */}
        <div>
          <div className="bg-black/5 rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Get in Touch</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <FiMail className="text-xl text-black/60" />
                <div>
                  <p className="text-sm text-black/40">Email</p>
                  <p className="font-medium">support@smartswaasth.com</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FiPhone className="text-xl text-black/60" />
                <div>
                  <p className="text-sm text-black/40">Phone</p>
                  <p className="font-medium">+1 (555) 123-4567</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FiMapPin className="text-xl text-black/60" />
                <div>
                  <p className="text-sm text-black/40">Address</p>
                  <p className="font-medium">123 Health Street<br />Medical City, MC 12345</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FiClock className="text-xl text-black/60" />
                <div>
                  <p className="text-sm text-black/40">Business Hours</p>
                  <p className="font-medium">Mon-Fri: 9AM - 6PM EST</p>
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
            <h3 className="font-bold text-red-800 mb-2">Medical Emergency?</h3>
            <p className="text-sm text-red-700 mb-3">
              For medical emergencies, please call emergency services immediately.
            </p>
            <p className="text-2xl font-bold text-red-800">911</p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="border border-black/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">Send us a Message</h2>
          
          {submitted ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <FiCheckCircle className="text-green-500 text-3xl mx-auto mb-2" />
              <p className="text-green-800 font-semibold">Message Sent!</p>
              <p className="text-sm text-green-600">We'll get back to you soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-black/15 rounded-lg focus:outline-none focus:border-black/30"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-black/15 rounded-lg focus:outline-none focus:border-black/30"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Subject *</label>
                <input
                  type="text"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-black/15 rounded-lg focus:outline-none focus:border-black/30"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Message *</label>
                <textarea
                  name="message"
                  required
                  rows="5"
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-black/15 rounded-lg focus:outline-none focus:border-black/30 resize-none"
                ></textarea>
              </div>
              
              <button
                type="submit"
                className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-black/90 transition-colors flex items-center justify-center gap-2"
              >
                <FiSend /> Send Message
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Support Note */}
      <div className="mt-8 text-center text-sm text-black/40">
        <FiMessageSquare className="mx-auto mb-2" />
        <p>Average response time: 2-4 hours during business hours</p>
      </div>
    </div>
  );
}