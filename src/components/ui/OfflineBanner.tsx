import { useState, useEffect } from "react";
import { useStore } from "../../store/useStore";

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showSynced, setShowSynced] = useState(false);
  const offlineQueue = useStore((s) => s.offlineQueue);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (offlineQueue.length > 0) setShowSynced(true);
      setTimeout(() => setShowSynced(false), 3000);
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [offlineQueue.length]);

  if (isOnline && !showSynced) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "env(safe-area-inset-top, 0px)",
        left: 0,
        right: 0,
        zIndex: 100,
        display: "flex",
        justifyContent: "center",
        padding: "8px 16px",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 16px",
          borderRadius: 99,
          background: isOnline ? "var(--income)" : "#1C1C1E",
          color: isOnline ? "#fff" : "#FFD60A",
          fontSize: 12,
          fontWeight: 700,
          boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
          transition: "all 300ms ease",
          letterSpacing: "0.2px",
        }}
      >
        <i
          className={`fa-solid ${isOnline ? "fa-wifi" : "fa-wifi-slash"}`}
          style={{ fontSize: 11 }}
        />
        {isOnline
          ? offlineQueue.length > 0
            ? `Syncing ${offlineQueue.length} change${offlineQueue.length !== 1 ? "s" : ""}...`
            : "Back online"
          : `Offline Mode${offlineQueue.length > 0 ? ` . ${offlineQueue.length} pending` : ""}`}
      </div>
    </div>
  );
}
