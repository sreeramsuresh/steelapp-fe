import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';

/**
 * ReservationTimer Component
 *
 * Displays countdown timer for batch reservation expiry.
 * Shows warning when time is running low and provides extend option.
 *
 * Features:
 * - Real-time countdown display (MM:SS format)
 * - Warning state when < 5 minutes remaining
 * - Critical state when < 1 minute remaining
 * - Extend button to add more time
 * - Callback when reservation expires
 */
const ReservationTimer = ({
  expiresAt,
  onExpired,
  onExtend,
  warningThresholdMs = 5 * 60 * 1000, // 5 minutes
  criticalThresholdMs = 60 * 1000, // 1 minute
}) => {
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isExtending, setIsExtending] = useState(false);

  // Calculate initial time remaining
  useEffect(() => {
    if (!expiresAt) {
      setTimeRemaining(null);
      return;
    }

    const calculateRemaining = () => {
      const now = new Date();
      const expiry = new Date(expiresAt);
      const diff = expiry - now;
      return Math.max(0, diff);
    };

    setTimeRemaining(calculateRemaining());

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        if (onExpired) {
          onExpired();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  // Format time as MM:SS
  const formatTime = useCallback((ms) => {
    if (ms === null || ms <= 0) return '00:00';

    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Determine timer state for styling
  const timerState = useMemo(() => {
    if (timeRemaining === null) return 'inactive';
    if (timeRemaining <= 0) return 'expired';
    if (timeRemaining <= criticalThresholdMs) return 'critical';
    if (timeRemaining <= warningThresholdMs) return 'warning';
    return 'normal';
  }, [timeRemaining, warningThresholdMs, criticalThresholdMs]);

  // Handle extend button click
  const handleExtend = useCallback(async () => {
    if (!onExtend || isExtending) return;

    setIsExtending(true);
    try {
      await onExtend();
    } catch (err) {
      console.error('Failed to extend reservation:', err);
    } finally {
      setIsExtending(false);
    }
  }, [onExtend, isExtending]);

  // Don't render if no expiry time
  if (!expiresAt || timeRemaining === null) {
    return null;
  }

  // Get status message based on state
  const getStatusMessage = () => {
    switch (timerState) {
      case 'expired':
        return 'Reservation expired';
      case 'critical':
        return 'Expiring soon!';
      case 'warning':
        return 'Time running low';
      default:
        return 'Reservation active';
    }
  };

  return (
    <div className={`reservation-timer timer-${timerState}`}>
      <div className="timer-icon">
        {timerState === 'expired' ? (
          <span className="icon-expired">!</span>
        ) : (
          <span className="icon-clock">&#x23F1;</span>
        )}
      </div>

      <div className="timer-content">
        <div className="timer-label">{getStatusMessage()}</div>
        <div className="timer-countdown">
          <span className="timer-value">{formatTime(timeRemaining)}</span>
          {timerState !== 'expired' && <span className="timer-unit">remaining</span>}
        </div>
      </div>

      {onExtend && timerState !== 'expired' && (
        <button
          type="button"
          className="timer-extend-btn"
          onClick={handleExtend}
          disabled={isExtending}
          title="Extend reservation by 30 minutes"
        >
          {isExtending ? '...' : '+30m'}
        </button>
      )}
    </div>
  );
};

ReservationTimer.propTypes = {
  expiresAt: PropTypes.string,
  onExpired: PropTypes.func,
  onExtend: PropTypes.func,
  warningThresholdMs: PropTypes.number,
  criticalThresholdMs: PropTypes.number,
};

export default ReservationTimer;
