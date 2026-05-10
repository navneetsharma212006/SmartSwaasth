import { FiAlertTriangle, FiCheckCircle, FiClock, FiShield } from "react-icons/fi";

const styles = {
  green: "bg-green-100 text-green-800 border-green-200",
  yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
  red: "bg-red-100 text-red-800 border-red-200",
  interaction: "bg-purple-100 text-purple-800 border-purple-200",
};

const icons = {
  green: <FiCheckCircle />,
  yellow: <FiClock />,
  red: <FiAlertTriangle />,
  interaction: <FiShield />,
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${styles[status.color]}`}
    >
      {icons[status.color]} {status.label}
    </span>
  );
}