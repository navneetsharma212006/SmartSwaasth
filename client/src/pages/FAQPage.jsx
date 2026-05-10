import { useState } from "react";
import { FiChevronDown, FiChevronUp, FiSearch } from "react-icons/fi";

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const faqs = [
    {
      question: "How does the OCR scanning work?",
      answer: "Our OCR (Optical Character Recognition) technology uses advanced AI to read text from medicine labels. Simply take a clear photo of the label, and our system extracts the medicine name, expiry date, and dosage instructions automatically with 99% accuracy."
    },
    {
      question: "Is my medical data secure?",
      answer: "Yes! We use bank-level encryption (256-bit SSL) to protect all your data. We are HIPAA compliant and GDPR ready. Your medical information is never shared with third parties without your explicit consent."
    },
    {
      question: "How does the drug interaction checker work?",
      answer: "Our interaction checker cross-references your medications against a comprehensive medical database of over 500,000 known drug interactions. It identifies potential conflicts and provides severity ratings to help you stay safe."
    },
    {
      question: "Can I use SmartSwaasth for multiple family members?",
      answer: "Absolutely! You can create separate profiles for each family member, making it easy to manage medications for children, elderly parents, or other dependents all from one account."
    },
    {
      question: "Is SmartSwaasth free to use?",
      answer: "SmartSwaasth offers a free forever plan that includes basic features like scanning up to 10 medicines and expiry tracking. Premium plans with unlimited scanning, advanced interaction checking, and priority support are also available."
    },
    {
      question: "How accurate is the expiry date detection?",
      answer: "Our expiry date detection has over 95% accuracy on clear labels. We also allow you to manually edit or confirm the detected date to ensure complete accuracy."
    },
    {
      question: "What happens when a medicine expires?",
      answer: "You'll receive notifications when medicines are approaching their expiry date (30 days before) and again when they expire. Expired medicines are highlighted in your dashboard with clear warnings."
    },
    {
      question: "Can I export my medication list?",
      answer: "Yes! You can export your complete medication history, including expiry dates and schedules, as a CSV or PDF file to share with your healthcare provider."
    },
    {
      question: "Do you support languages other than English?",
      answer: "Yes! Our OCR technology supports over 50 languages including Spanish, French, German, Chinese, Japanese, and more. The app interface is also available in multiple languages."
    },
    {
      question: "How do I set up medication reminders?",
      answer: "After scanning a medicine, you can set up custom reminders in the schedule manager. Choose specific times, dosage instructions, and get push notifications when it's time to take your medication."
    }
  ];

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
        <p className="text-xl text-black/60">
          Find answers to common questions about SmartSwaasth
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-8 relative">
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black/40" />
        <input
          type="text"
          placeholder="Search questions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-black/15 rounded-lg focus:outline-none focus:border-black/30"
        />
      </div>

      {/* FAQ List */}
      <div className="space-y-4">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-black/60">No questions found matching your search.</p>
          </div>
        ) : (
          filteredFaqs.map((faq, index) => (
            <div key={index} className="border border-black/10 rounded-lg overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-black/5 transition-colors"
              >
                <span className="font-semibold">{faq.question}</span>
                {openIndex === index ? <FiChevronUp /> : <FiChevronDown />}
              </button>
              {openIndex === index && (
                <div className="px-6 py-4 bg-black/5 border-t border-black/10">
                  <p className="text-black/70">{faq.answer}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Still Have Questions */}
      <div className="mt-12 bg-black/5 rounded-2xl p-8 text-center">
        <h3 className="text-xl font-bold mb-3">Still have questions?</h3>
        <p className="text-black/60 mb-6">
          Can't find the answer you're looking for? Please contact our support team.
        </p>
        <button className="bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-black/90">
          Contact Support
        </button>
      </div>
    </div>
  );
}