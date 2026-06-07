export function useHapticFeedback() {
  const vibrate = (duration: number | number[] = 10) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(duration);
      } catch (e) {
        // Suppress errors (some security policies block vib in iframe context)
      }
    }
  };

  const success = () => vibrate([12, 40, 12]);
  const error = () => vibrate([35, 60, 35]);
  const light = () => vibrate(10);
  const heavy = () => vibrate(45);

  return { vibrate, success, error, light, heavy };
}
