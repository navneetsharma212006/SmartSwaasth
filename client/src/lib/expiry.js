export function getExpiryStatus(expiryDate) {
  const exp = new Date(expiryDate);
  const now = new Date();
  const days = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: "Expired", color: "red", days };
  if (days <= 30) return { label: "Expiring Soon", color: "yellow", days };
  return { label: "Safe", color: "green", days };
}

export function formatDate(d) {
  if (!d) return "—";
  const date = new Date(d);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
