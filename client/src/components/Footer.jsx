import { Link } from "react-router-dom";
import { FiShield, FiMail, FiPhone, FiMapPin, FiArrowUp } from "react-icons/fi";
import { useState, useEffect } from "react";

export default function Footer() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Show/hide scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 bg-black text-white p-3 rounded-full shadow-lg hover:bg-black/80 transition-all transform hover:scale-110"
          aria-label="Scroll to top"
        >
          <FiArrowUp className="text-xl" />
        </button>
      )}

      <footer className="bg-white border-t border-black/10">
        <div className="mx-auto max-w-6xl px-4 pt-12 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            
            {/* Brand Column */}
            <div>
              <Link to="/" className="flex items-center gap-2 font-semibold text-lg mb-4">
                <FiShield className="text-2xl" />
                <span className="font-bold">SmartSwaasth</span>
              </Link>
              <p className="text-sm text-black/60 mb-4 leading-relaxed">
                Your smart medication manager for tracking expiry dates, checking interactions, and never missing a dose.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold mb-4 text-lg">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/" className="text-black/60 hover:text-black transition-colors flex items-center gap-2">
                    <span>→</span> Home
                  </Link>
                </li>
                <li>
                  <Link to="/scan" className="text-black/60 hover:text-black transition-colors flex items-center gap-2">
                    <span>→</span> Scan Medicine
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard" className="text-black/60 hover:text-black transition-colors flex items-center gap-2">
                    <span>→</span> Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-black/60 hover:text-black transition-colors flex items-center gap-2">
                    <span>→</span> About Us
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-black/60 hover:text-black transition-colors flex items-center gap-2">
                    <span>→</span> Contact
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="font-semibold mb-4 text-lg">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/how-it-works" className="text-black/60 hover:text-black transition-colors flex items-center gap-2">
                    <span>→</span> How It Works
                  </Link>
                </li>
                <li>
                  <Link to="/safety-guide" className="text-black/60 hover:text-black transition-colors flex items-center gap-2">
                    <span>→</span> Safety Guide
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="text-black/60 hover:text-black transition-colors flex items-center gap-2">
                    <span>→</span> FAQ
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className="text-black/60 hover:text-black transition-colors flex items-center gap-2">
                    <span>→</span> Blog
                  </Link>
                </li>
                <li>
                  <Link to="/support" className="text-black/60 hover:text-black transition-colors flex items-center gap-2">
                    <span>→</span> Support
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="font-semibold mb-4 text-lg">Contact Us</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-3 text-black/60">
                  <FiMail className="text-base flex-shrink-0" />
                  <span>support@smartswaasth.com</span>
                </li>
                <li className="flex items-center gap-3 text-black/60">
                  <FiPhone className="text-base flex-shrink-0" />
                  <span>+91 6267502221</span>
                </li>
                <li className="flex items-center gap-3 text-black/60">
                  <FiMapPin className="text-base flex-shrink-0" />
                  <span className="text-xs">123 Health Street, Medical City, MC 12345</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-black/10 pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-xs text-black/40">
                © 2024 SmartSwaasth. All rights reserved.
              </p>
              <div className="flex flex-wrap gap-6 text-xs">
                <Link to="/privacy" className="text-black/40 hover:text-black transition-colors">
                  Privacy Policy
                </Link>
                <Link to="/terms" className="text-black/40 hover:text-black transition-colors">
                  Terms of Service
                </Link>
                <Link to="/cookies" className="text-black/40 hover:text-black transition-colors">
                  Cookie Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}