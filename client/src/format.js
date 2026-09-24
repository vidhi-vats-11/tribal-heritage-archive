export const TYPE_LABELS = {
  AUDIO: 'Audio',
  VIDEO: 'Video',
  PHOTOGRAPH: 'Photograph',
  TEXT: 'Text',
  BUILT_STRUCTURE: 'Built structure',
};

export const titleCase = (s) => s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ');

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export function formatDuration(sec) {
  if (sec == null) return null;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const mm = String(m).padStart(h ? 2 : 1, '0');
  return `${h ? h + ':' : ''}${mm}:${String(s).padStart(2, '0')}`;
}

// sizeBytes arrives as a string (BigInt on the server).
export function formatBytes(str) {
  const n = Number(str);
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let v = n;
  while (v >= 1000 && i < units.length - 1) { v /= 1000; i++; }
  return `${v.toFixed(i ? 1 : 0)} ${units[i]}`;
}

export const placeLabel = (p) => `${p.village}, ${p.district}`;
