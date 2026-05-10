import { FiAlertTriangle, FiInfo, FiX } from "react-icons/fi";

export default function InteractionAlert({ interactions, onClose }) {
  const severityColors = {
    severe: "border-red-200 bg-red-50 text-red-900",
    moderate: "border-yellow-200 bg-yellow-50 text-yellow-900",
    mild: "border-blue-200 bg-blue-50 text-blue-900",
  };

  const severityIcons = {
    severe: <FiAlertTriangle className="text-red-600" />,
    moderate: <FiAlertTriangle className="text-yellow-600" />,
    mild: <FiInfo className="text-blue-600" />,
  };

  if (!interactions || interactions.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-w-2xl w-full rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-black/10 p-4">
          <div className="flex items-center gap-2">
            <FiAlertTriangle className="text-red-600" />
            <h2 className="text-xl font-semibold">Drug Interactions Detected</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-black/5 rounded">
            <FiX />
          </button>
        </div>
        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
          {interactions.map((interaction, idx) => (
            <div
              key={idx}
              className={`rounded-lg border p-4 ${severityColors[interaction.severity]}`}
            >
              <div className="flex items-start gap-3">
                {severityIcons[interaction.severity]}
                <div className="flex-1">
                  <p className="font-semibold">
                    {interaction.drug1} ↔ {interaction.drug2}
                  </p>
                  <p className="text-sm mt-1">{interaction.description}</p>
                  <p className="text-xs mt-2 font-medium uppercase">
                    Severity: {interaction.severity}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-black/10 p-4">
          <button
            onClick={onClose}
            className="w-full rounded-md bg-black px-4 py-2 text-white hover:bg-black/90"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}