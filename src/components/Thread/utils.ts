export const calculateFontSize = (contentLength: number): string => {
  // Base font size for short content
  const baseFontSize = 18; // text-lg equivalent (18px)
  const minFontSize = 12; // text-xs equivalent (12px)

  // More aggressive scaling for better space utilization
  // Short content (< 150 chars): full size
  // Medium content (150-800 chars): scale down gradually
  // Long content (> 800 chars): minimum size

  if (contentLength <= 150) {
    return `${baseFontSize}px`;
  }
  if (contentLength <= 800) {
    // Linear interpolation between base and min
    const ratio = (contentLength - 150) / 650; // 650 = 800 - 150
    const fontSize = baseFontSize - (baseFontSize - minFontSize) * ratio;
    return `${Math.max(fontSize, minFontSize)}px`;
  }
  return `${minFontSize}px`;
};

export function timeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const seconds = Math.floor((now - then) / 1000);

  const intervals = [
    { label: 'year', secs: 31536000 },
    { label: 'month', secs: 2592000 },
    { label: 'week', secs: 604800 },
    { label: 'day', secs: 86400 },
    { label: 'hour', secs: 3600 },
    { label: 'minute', secs: 60 },
    { label: 'second', secs: 1 },
  ];

  for (const { label, secs } of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) {
      return `${count} ${label}${count > 1 ? 's' : ''} ago`;
    }
  }

  return 'just now';
}

export function convertDate(date: string): string {
  const dateParts = date.split('T');
  const dateParts2 = dateParts[0]!.split('-');
  return `${dateParts2[1]}-${dateParts2[2]}-${dateParts2[0]}`;
}
