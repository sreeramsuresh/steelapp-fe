import { AlertCircle, Clock, Lock, Unlock } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";

export default function StockReservationToggle({ item, index, onToggleReservation }) {
  const { isDarkMode } = useTheme();
  const [timeRemaining, setTimeRemaining] = useState("");

  useEffect(() => {
    if (!item.stockReserved || !item.reservationExpiry) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTimeRemaining("");
      return;
    }

    const updateTimer = () => {
      const expiryTime = new Date(item.reservationExpiry);
      const now = new Date();
      const diffMs = expiryTime - now;

      if (diffMs <= 0) {
        setTimeRemaining("Expired");
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [item.stockReserved, item.reservationExpiry]);

  const handleToggle = () => {
    if (item.stockReserved) {
      // Release reservation
      onToggleReservation(index, false, null);
    } else {
      // Reserve stock for 2 hours
      const expiryTime = new Date();
      expiryTime.setHours(expiryTime.getHours() + 2);
      onToggleReservation(index, true, expiryTime.toISOString());
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleToggle}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm transition-colors ${
          item.stockReserved
            ? isDarkMode
              ? "bg-green-900 text-green-200 hover:bg-green-800"
              : "bg-green-100 text-green-700 hover:bg-green-200"
            : isDarkMode
              ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
        title={item.stockReserved ? "Release reservation" : "Reserve stock (2 hours)"}
      >
        {item.stockReserved ? (
          <>
            <Lock className="h-4 w-4" />
            Reserved
          </>
        ) : (
          <>
            <Unlock className="h-4 w-4" />
            Reserve
          </>
        )}
      </button>

      {item.stockReserved && timeRemaining && (
        <div
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${
            timeRemaining === "Expired"
              ? isDarkMode
                ? "bg-red-900 text-red-200"
                : "bg-red-100 text-red-700"
              : isDarkMode
                ? "bg-blue-900 text-blue-200"
                : "bg-blue-100 text-blue-700"
          }`}
        >
          {timeRemaining === "Expired" ? (
            <>
              <AlertCircle className="h-3 w-3" />
              Expired
            </>
          ) : (
            <>
              <Clock className="h-3 w-3" />
              {timeRemaining}
            </>
          )}
        </div>
      )}
    </div>
  );
}
