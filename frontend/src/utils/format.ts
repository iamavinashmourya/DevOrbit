
/**
 * Formats a duration in minutes into a human-readable string.
 * Examples:
 * 45 -> "45m"
 * 70 -> "1h 10m"
 * 125 -> "2h 5m"
 * 0 -> "0m"
 */
export const formatDuration = (minutes: number): string => {
    if (!minutes) return "0m";

    const minutesInt = Math.round(minutes);
    if (minutesInt < 60) {
        return `${minutesInt}m`;
    }

    const hours = Math.floor(minutesInt / 60);
    const mins = minutesInt % 60;

    if (mins === 0) {
        return `${hours}h`;
    }

    return `${hours}h ${mins}m`;
};
