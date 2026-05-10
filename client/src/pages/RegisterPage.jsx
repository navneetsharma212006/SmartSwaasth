import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { registerUser } from "../lib/api";
import { FiUser, FiMail, FiLock, FiAlertCircle, FiShield } from "react-icons/fi";

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "patient"
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await registerUser(formData);
      login(data.user, data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-black">Create account</h2>
          <p className="mt-2 text-sm text-black/60">
            Join SmartSwaasth today
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            <FiAlertCircle className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black/70" htmlFor="name">
                Full name
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <FiUser className="text-black/40" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="block w-full rounded-lg border border-black/15 bg-white py-2.5 pl-10 pr-3 text-sm placeholder:text-black/30 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-black/70" htmlFor="email">
                Email address
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <FiMail className="text-black/40" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="block w-full rounded-lg border border-black/15 bg-white py-2.5 pl-10 pr-3 text-sm placeholder:text-black/30 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-black/70" htmlFor="password">
                Password
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <FiLock className="text-black/40" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="block w-full rounded-lg border border-black/15 bg-white py-2.5 pl-10 pr-3 text-sm placeholder:text-black/30 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-black/70">
                I am a...
              </label>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border p-3 text-sm transition ${formData.role === 'patient' ? 'border-black bg-black text-white' : 'border-black/15 bg-white text-black/70 hover:bg-black/5'}`}>
                  <input
                    type="radio"
                    name="role"
                    value="patient"
                    className="sr-only"
                    checked={formData.role === 'patient'}
                    onChange={handleChange}
                  />
                  <span>Patient</span>
                </label>
                <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border p-3 text-sm transition ${formData.role === 'caregiver' ? 'border-black bg-black text-white' : 'border-black/15 bg-white text-black/70 hover:bg-black/5'}`}>
                  <input
                    type="radio"
                    name="role"
                    value="caregiver"
                    className="sr-only"
                    checked={formData.role === 'caregiver'}
                    onChange={handleChange}
                  />
                  <span>Caregiver</span>
                </label>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black py-2.5 text-sm font-semibold text-white transition hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-black/20 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-black/60">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-black hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
