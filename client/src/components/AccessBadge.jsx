const STYLES = {
  PUBLIC: 'bg-green-100 text-green-800 ring-green-600/30',
  RESEARCHER: 'bg-blue-100 text-blue-800 ring-blue-600/30',
  COMMUNITY: 'bg-amber-100 text-amber-900 ring-amber-600/40',
  RESTRICTED: 'bg-red-100 text-red-800 ring-red-600/30',
};

const DOTS = {
  PUBLIC: 'bg-green-600',
  RESEARCHER: 'bg-blue-600',
  COMMUNITY: 'bg-amber-500',
  RESTRICTED: 'bg-red-600',
};

export const ACCESS_HELP = {
  PUBLIC: 'Open to anyone.',
  RESEARCHER: 'Available to registered researchers.',
  COMMUNITY: 'Shared only with members of the source community.',
  RESTRICTED: 'Closed at the request of the community; not for listening or reuse.',
};

export default function AccessBadge({ level, large = false }) {
  const size = large ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset ${size} ${STYLES[level] || ''}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${DOTS[level] || 'bg-stone-400'}`} aria-hidden />
      {level.charAt(0) + level.slice(1).toLowerCase()}
    </span>
  );
}
