import { FiShield, FiAlertTriangle, FiClock, FiBookOpen, FiCheckCircle, FiInfo } from "react-icons/fi";

export default function SafetyGuidePage() {
  const safetyTips = [
    {
      title: "Always Check Expiry Dates",
      description: "Never take medication past its expiry date. Expired medicines may lose effectiveness or become harmful.",
      icon: <FiClock className="text-2xl" />
    },
    {
      title: "Avoid Dangerous Combinations",
      description: "Some medications can interact badly with each other. Always check for interactions before starting new meds.",
      icon: <FiAlertTriangle className="text-2xl" />
    },
    {
      title: "Follow Dosage Instructions",
      description: "Take exactly as prescribed. Never double up on doses or change dosage without consulting your doctor.",
      icon: <FiBookOpen className="text-2xl" />
    }
  ];

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Medication Safety Guide</h1>
        <p className="text-xl text-black/60">
          Essential tips to keep you and your family safe
        </p>
      </div>

      {/* Emergency Warning */}
      <div className="mb-8 bg-red-50 border border-red-200 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <FiAlertTriangle className="text-red-600 text-3xl flex-shrink-0" />
          <div>
            <h2 className="text-xl font-bold text-red-800 mb-2">Emergency Warning</h2>
            <p className="text-red-700">
              If you experience severe side effects, allergic reactions, or suspect an overdose, 
              call emergency services immediately or visit the nearest emergency room.
            </p>
          </div>
        </div>
      </div>

      {/* Key Safety Tips */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Key Safety Tips</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {safetyTips.map((tip, index) => (
            <div key={index} className="p-6 border border-black/10 rounded-xl">
              <div className="mb-3">{tip.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{tip.title}</h3>
              <p className="text-sm text-black/60">{tip.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Common Interactions */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Common Drug Interactions to Watch For</h2>
        <div className="space-y-4">
          <div className="p-4 border border-black/10 rounded-lg">
            <h3 className="font-semibold mb-2">Blood Thinners + Pain Relievers</h3>
            <p className="text-sm text-black/60">
              Combining blood thinners with certain pain relievers like ibuprofen can increase bleeding risk.
            </p>
          </div>
          <div className="p-4 border border-black/10 rounded-lg">
            <h3 className="font-semibold mb-2">Antibiotics + Oral Contraceptives</h3>
            <p className="text-sm text-black/60">
              Some antibiotics may reduce the effectiveness of birth control pills.
            </p>
          </div>
          <div className="p-4 border border-black/10 rounded-lg">
            <h3 className="font-semibold mb-2">Herbal Supplements + Prescriptions</h3>
            <p className="text-sm text-black/60">
              Natural doesn't always mean safe. Herbal supplements like St. John's Wort can interact with many medications.
            </p>
          </div>
        </div>
      </div>

      {/* Storage Guidelines */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Proper Medication Storage</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold mb-2 text-green-800">✓ DO</h3>
            <ul className="space-y-1 text-sm text-green-700">
              <li>Store in a cool, dry place</li>
              <li>Keep in original containers</li>
              <li>Use child-resistant caps</li>
              <li>Check expiry dates regularly</li>
            </ul>
          </div>
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-semibold mb-2 text-red-800">✗ DON'T</h3>
            <ul className="space-y-1 text-sm text-red-700">
              <li>Store in bathrooms (humidity)</li>
              <li>Remove from original packaging</li>
              <li>Share prescriptions with others</li>
              <li>Use after expiry date</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Disposal Guide */}
      <div className="mb-12 bg-black/5 rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-4">Safe Medication Disposal</h2>
        <p className="text-black/70 mb-4">
          Never flush medications down the toilet or throw in regular trash unless specified.
        </p>
        <div className="space-y-2 text-sm">
          <p className="flex items-center gap-2">
            <FiCheckCircle className="text-green-500" />
            Use FDA-approved take-back programs
          </p>
          <p className="flex items-center gap-2">
            <FiCheckCircle className="text-green-500" />
            Mix with unpalatable substances (dirt, coffee grounds)
          </p>
          <p className="flex items-center gap-2">
            <FiCheckCircle className="text-green-500" />
            Remove personal info from labels
          </p>
        </div>
      </div>

      {/* Warning Signs */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">When to Seek Medical Help</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-3 border border-black/10 rounded-lg">
            <FiAlertTriangle className="text-yellow-600 mb-2" />
            <p className="text-sm">Difficulty breathing or swallowing</p>
          </div>
          <div className="p-3 border border-black/10 rounded-lg">
            <FiAlertTriangle className="text-yellow-600 mb-2" />
            <p className="text-sm">Severe skin rash or hives</p>
          </div>
          <div className="p-3 border border-black/10 rounded-lg">
            <FiAlertTriangle className="text-yellow-600 mb-2" />
            <p className="text-sm">Swelling of face, lips, or tongue</p>
          </div>
          <div className="p-3 border border-black/10 rounded-lg">
            <FiAlertTriangle className="text-yellow-600 mb-2" />
            <p className="text-sm">Chest pain or irregular heartbeat</p>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="text-center text-xs text-black/40 border-t border-black/10 pt-6">
        <FiInfo className="mx-auto mb-2" />
        <p>
          This guide is for informational purposes only. Always consult your healthcare provider 
          for medical advice, diagnosis, or treatment.
        </p>
      </div>
    </div>
  );
}