import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../lib/api";
import { FiMail, FiLock, FiAlertCircle } from "react-icons/fi";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await loginUser(email, password);
      login(data.user, data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-black">Welcome back</h2>
          <p className="mt-2 text-sm text-black/60">
            Sign in to your SmartSwaasth account
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
              <label className="block text-sm font-medium text-black/70" htmlFor="email">
                Email address
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <FiMail className="text-black/40" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  className="block w-full rounded-lg border border-black/15 bg-white py-2.5 pl-10 pr-3 text-sm placeholder:text-black/30 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  type="password"
                  required
                  className="block w-full rounded-lg border border-black/15 bg-white py-2.5 pl-10 pr-3 text-sm placeholder:text-black/30 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black py-2.5 text-sm font-semibold text-white transition hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-black/20 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm text-black/60">
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold text-black hover:underline">
            Register for free
          </Link>
        </p>
      </div>
    </div>
  );
}
