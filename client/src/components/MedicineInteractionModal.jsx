import { useState, useEffect } from "react";
import { FiAlertTriangle, FiInfo, FiX, FiActivity, FiShield, FiAlertOctagon } from "react-icons/fi";
import { checkInteractions } from "../lib/api";

export default function MedicineInteractionModal({ isOpen, onClose, medicineIds, medicineNames }) {
  const [loading, setLoading] = useState(false);
  const [interactions, setInteractions] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && (medicineIds?.length > 0 || medicineNames?.length > 0)) {
      performCheck();
    }
  }, [isOpen, medicineIds, medicineNames]);

  const performCheck = async () => {
    setLoading(true);
    setError(null);
    try {
      // The backend API handles both ids and names via req.body.medicineIds
      // or we can use checkMedicineInteractions(medicineNames)
      const data = await checkInteractions(medicineIds);
      setInteractions(data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to check interactions.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const severityColors = {
    major: "bg-red-50 text-red-700 border-red-100 icon-red-500",
    moderate: "bg-amber-50 text-amber-700 border-amber-100 icon-amber-500",
    low: "bg-blue-50 text-blue-700 border-blue-100 icon-blue-500",
    unknown: "bg-gray-50 text-gray-700 border-gray-100 icon-gray-500",
    none: "bg-emerald-50 text-emerald-700 border-emerald-100 icon-emerald-500",
  };

  const severityIcons = {
    major: <FiAlertOctagon className="text-red-500 text-xl" />,
    moderate: <FiAlertTriangle className="text-amber-500 text-xl" />,
    low: <FiInfo className="text-blue-500 text-xl" />,
    unknown: <FiInfo className="text-gray-500 text-xl" />,
    none: <FiShield className="text-emerald-500 text-xl" />,
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-black/5 flex items-center justify-between bg-black/[0.02]">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FiActivity className="text-black" />
            Medicine Interaction Check
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <FiX className="text-black/40" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-black/40">
              <div className="w-12 h-12 border-4 border-black/10 border-t-black rounded-full animate-spin mb-4" />
              <p className="font-medium">Analyzing RxNorm & FDA data...</p>
            </div>
          ) : error ? (
            <div className="p-6 bg-red-50 text-red-900 border border-red-100 rounded-2xl flex items-center gap-3">
              <FiAlertOctagon className="text-red-500" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          ) : !interactions || (interactions.pairs && interactions.pairs.length === 0) ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                <FiShield size={32} />
              </div>
              <h3 className="text-lg font-bold text-black mb-2">No Interactions Detected</h3>
              <p className="text-black/50 text-sm max-w-sm mx-auto">
                Our analysis of FDA labeling for these medicines did not find any major cross-references for drug-drug interactions.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                <p className="text-sm text-emerald-900 leading-relaxed italic">
                  "Checking interactions for: {interactions.medicines.map(m => m.inputName).join(", ")}"
                </p>
              </div>

              <div className="space-y-4">
                {interactions.pairs.map((pair, i) => (
                  <div key={i} className={`p-5 rounded-2xl border ${severityColors[pair.severity]}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {severityIcons[pair.severity]}
                        <h4 className="font-bold uppercase tracking-tight text-sm">
                          {pair.drugA} + {pair.drugB}
                        </h4>
                      </div>
                      <span className="px-3 py-1 bg-white/50 rounded-full text-[10px] font-bold uppercase border border-current opacity-70">
                        {pair.severity}
                      </span>
                    </div>
                    
                    <p className="text-sm font-medium mb-3 leading-relaxed">
                      {pair.summary}
                    </p>

                    {pair.snippet && (
                      <div className="bg-white/40 p-4 rounded-xl text-xs font-mono border border-black/5 leading-relaxed text-black/70">
                        "{pair.snippet}"
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-black/5 p-4 rounded-2xl text-[11px] text-black/50 leading-relaxed">
                <p className="mb-2 font-bold uppercase tracking-wider flex items-center gap-1">
                  <FiInfo size={12} /> Medical Disclaimer
                </p>
                This tool is for informational purposes only and uses a heuristic cross-match of FDA labeling text. 
                It is NOT a substitute for professional medical advice, diagnosis, or treatment. 
                Always consult your doctor or pharmacist before starting or changing medications.
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-black/5 bg-black/[0.01] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-black text-white rounded-xl font-medium hover:bg-black/90 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
