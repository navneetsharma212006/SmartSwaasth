import { useEffect, useRef, useState } from "react";
import { FiCamera, FiX, FiRefreshCw } from "react-icons/fi";

export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const startCamera = async () => {
    setIsLoading(true);
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (e) {
      setError("Unable to access camera. Please check permissions.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      const stream = videoRef.current?.srcObject;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const snap = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      const file = new File([blob], `scan-${Date.now()}.jpg`, { type: "image/jpeg" });
      onCapture(file);
    }, "image/jpeg", 0.92);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 p-4">
      <div className="flex justify-end">
        <button
          onClick={onClose}
          className="rounded-md bg-white/10 p-2 text-white hover:bg-white/20"
        >
          <FiX />
        </button>
      </div>
      <div className="flex flex-1 items-center justify-center">
        {error ? (
          <div className="text-center">
            <p className="text-white mb-4">{error}</p>
            <button
              onClick={startCamera}
              className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-black"
            >
              <FiRefreshCw /> Try Again
            </button>
          </div>
        ) : isLoading ? (
          <p className="text-white">Initializing camera...</p>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="max-h-full max-w-full rounded-lg"
          />
        )}
      </div>
      <div className="flex justify-center pt-4">
        <button
          onClick={snap}
          disabled={!!error || isLoading}
          className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-medium text-black disabled:opacity-50"
        >
          <FiCamera /> Capture Label
        </button>
      </div>
    </div>
  );
}