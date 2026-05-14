import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiUpload, FiCamera, FiLoader, FiImage, FiEdit3 } from "react-icons/fi";
import CameraCapture from "../components/CameraCapture.jsx";
import { extractMedicine, createManualMedicine, extractPatientMedicine, createPatientManualMedicine } from "../lib/api.js";
import { useParams } from "react-router-dom";

function DosageFields({ dosageCount, dosageTimes, onCountChange, onTimeChange }) {
  return (
    <div className="mt-6 space-y-4 rounded-xl border border-black/10 bg-black/[0.02] p-4">
      <div>
        <h3 className="text-sm font-semibold text-black">Dosage</h3>
        <p className="mt-0.5 text-xs text-black/55">
          How many times per day the medicine or syrup should be taken (1–3). Enter the time for each dose.
        </p>
      </div>
      <div>
        <label htmlFor="dosage-count" className="block text-sm font-medium text-black/80">
          Times per day
        </label>
        <select
          id="dosage-count"
          value={dosageCount}
          onChange={(e) => onCountChange(Number(e.target.value))}
          className="mt-1.5 w-full max-w-xs rounded-md border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-black/30"
        >
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
        </select>
      </div>
      <div className="space-y-3">
        {Array.from({ length: dosageCount }, (_, i) => (
          <div key={i}>
            <label
              htmlFor={`dose-time-${i}`}
              className="block text-sm font-medium text-black/80"
            >
              Dose {i + 1} — time
            </label>
            <input
              id={`dose-time-${i}`}
              type="time"
              value={dosageTimes[i] ?? ""}
              onChange={(e) => onTimeChange(i, e.target.value)}
              className="mt-1.5 w-full max-w-xs rounded-md border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-black/30"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function UploadPage() {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [mode, setMode] = useState("scan");
  const navigate = useNavigate();
  const { patientId } = useParams();

  const [dosageCount, setDosageCount] = useState(1);
  const [dosageTimes, setDosageTimes] = useState([""]);

  const [form, setForm] = useState({
    name: "",
    expiryDate: "",
    tabletsInPacket: "",
    syrupAmountMl: "",
  });

  const handleDosageCountChange = (c) => {
    const n = Math.min(3, Math.max(1, Number(c) || 1));
    setDosageCount(n);
    setDosageTimes((prev) => {
      const next = prev.slice(0, n);
      while (next.length < n) next.push("");
      return next;
    });
  };

  const handleDosageTimeChange = (index, value) => {
    setDosageTimes((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const buildDosagePayload = () => ({
    dosagePerDay: dosageCount,
    dosageTimes: dosageTimes.slice(0, dosageCount),
  });

  const validateDosageClient = () => {
    const slice = dosageTimes.slice(0, dosageCount);
    for (let i = 0; i < dosageCount; i++) {
      if (!slice[i] || !String(slice[i]).trim()) {
        return `Please enter a time for dose ${i + 1}.`;
      }
    }
    return null;
  };

  const pickFile = (f) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError("");
  };

  const handleFileChange = (e) => pickFile(e.target.files?.[0]);

  const handleCapture = (f) => {
    setShowCamera(false);
    pickFile(f);
  };

  const handleExtract = async () => {
    if (!file) return;
    const doseErr = validateDosageClient();
    if (doseErr) {
      setError(doseErr);
      return;
    }
    setLoading(true);
    setError("");
    try {
      let data;
      if (patientId) {
        data = await extractPatientMedicine(patientId, file, buildDosagePayload());
        navigate(`/result/${patientId}`, { state: data });
      } else {
        data = await extractMedicine(file, buildDosagePayload());
        navigate("/result", { state: data });
      }
    } catch (e) {
      setError(e.response?.data?.error || "Failed to extract medicine info.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    const doseErr = validateDosageClient();
    if (doseErr) {
      setError(doseErr);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload = {
        name: form.name.trim(),
        expiryDate: form.expiryDate,
        tabletsInPacket: form.tabletsInPacket.trim(),
        syrupAmountMl: form.syrupAmountMl.trim(),
        ...buildDosagePayload(),
      };
      let data;
      if (patientId) {
        data = await createPatientManualMedicine(patientId, payload);
        navigate(`/result/${patientId}`, { state: data });
      } else {
        data = await createManualMedicine(payload);
        navigate("/result", { state: data });
      }
    } catch (err) {
      setError(
        err.response?.data?.error || "Could not save medicine. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-semibold tracking-tight">Add a medicine</h1>
      <p className="mt-2 text-black/60">
        Scan a label to extract details automatically, or enter the details yourself.
        We store your medicines and check expiry and interactions.
      </p>

      <div className="mt-6 flex rounded-lg border border-black/10 bg-black/[0.03] p-1">
        <button
          type="button"
          onClick={() => {
            setMode("scan");
            setError("");
          }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition ${
            mode === "scan"
              ? "bg-white text-black shadow-sm"
              : "text-black/60 hover:text-black"
          }`}
        >
          <FiImage /> Scan label
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("form");
            setError("");
          }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition ${
            mode === "form"
              ? "bg-white text-black shadow-sm"
              : "text-black/60 hover:text-black"
          }`}
        >
          <FiEdit3 /> Enter details
        </button>
      </div>

      {mode === "scan" ? (
        <div className="mt-6 rounded-2xl border border-black/10 bg-white p-6">
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-black/15 p-8">
            {preview ? (
              <img
                src={preview}
                alt="Preview"
                className="max-h-64 rounded-lg object-contain"
              />
            ) : (
              <>
                <FiImage className="text-4xl text-black/40" />
                <p className="text-sm text-black/60">
                  PNG, JPG or JPEG up to 8MB
                </p>
                <p className="text-xs text-black/40">
                  Make sure the label is clearly visible
                </p>
              </>
            )}

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-md border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5"
              >
                <FiUpload /> Choose image
              </button>
              <button
                type="button"
                onClick={() => setShowCamera(true)}
                className="inline-flex items-center gap-2 rounded-md border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5"
              >
                <FiCamera /> Use camera
              </button>
            </div>
          </div>

          <DosageFields
            dosageCount={dosageCount}
            dosageTimes={dosageTimes}
            onCountChange={handleDosageCountChange}
            onTimeChange={handleDosageTimeChange}
          />

          {error && (
            <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleExtract}
            disabled={!file || loading}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-black px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? (
              <>
                <FiLoader className="animate-spin" /> Processing image and checking interactions…
              </>
            ) : (
              <>Extract medicine info & check interactions</>
            )}
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleManualSubmit}
          className="mt-6 space-y-5 rounded-2xl border border-black/10 bg-white p-6"
        >
          <div>
            <label htmlFor="med-name" className="block text-sm font-medium text-black/80">
              Medicine name <span className="text-red-600">*</span>
            </label>
            <input
              id="med-name"
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Paracetamol 500 mg"
              className="mt-1.5 w-full rounded-md border border-black/15 px-3 py-2 text-sm outline-none focus:border-black/30"
            />
          </div>

          <div>
            <label htmlFor="med-expiry" className="block text-sm font-medium text-black/80">
              Expiry date <span className="text-red-600">*</span>
            </label>
            <input
              id="med-expiry"
              type="date"
              required
              value={form.expiryDate}
              onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
              className="mt-1.5 w-full rounded-md border border-black/15 px-3 py-2 text-sm outline-none focus:border-black/30"
            />
          </div>

          <div>
            <label htmlFor="med-tablets" className="block text-sm font-medium text-black/80">
              Tablets left in packet
            </label>
            <input
              id="med-tablets"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={form.tabletsInPacket}
              onChange={(e) => setForm((f) => ({ ...f, tabletsInPacket: e.target.value }))}
              placeholder="Optional — for tablets / capsules"
              className="mt-1.5 w-full rounded-md border border-black/15 px-3 py-2 text-sm outline-none focus:border-black/30"
            />
          </div>

          <div>
            <label htmlFor="med-syrup" className="block text-sm font-medium text-black/80">
              Syrup in bottle (ml)
            </label>
            <input
              id="med-syrup"
              type="number"
              min="0"
              step="0.1"
              inputMode="decimal"
              value={form.syrupAmountMl}
              onChange={(e) => setForm((f) => ({ ...f, syrupAmountMl: e.target.value }))}
              placeholder="Optional — total liquid remaining in ml"
              className="mt-1.5 w-full rounded-md border border-black/15 px-3 py-2 text-sm outline-none focus:border-black/30"
            />
          </div>

          <DosageFields
            dosageCount={dosageCount}
            dosageTimes={dosageTimes}
            onCountChange={handleDosageCountChange}
            onTimeChange={handleDosageTimeChange}
          />

          <p className="text-xs text-black/50">
            Fill tablet count and/or syrup amount depending on what you have. Leave unused fields empty.
          </p>

          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-black px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? (
              <>
                <FiLoader className="animate-spin" /> Saving…
              </>
            ) : (
              <>Save medicine & check interactions</>
            )}
          </button>
        </form>
      )}

      {showCamera && (
        <CameraCapture
          onCapture={handleCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}
