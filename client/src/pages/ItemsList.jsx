import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import AccessBadge from '../components/AccessBadge.jsx';
import { Loading, ErrorBox } from '../components/Loading.jsx';
import { TYPE_LABELS, placeLabel } from '../format.js';

const FILTER_KEYS = ['q', 'community', 'language', 'type', 'access', 'session'];

export default function ItemsList() {
  const [params, setParams] = useSearchParams();
  const [vocab, setVocab] = useState(null);
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState(params.get('q') || '');
  const navigate = useNavigate();

  useEffect(() => {
    api('/vocab').then(setVocab).catch(setError);
  }, []);

  // Filters live in the URL, so a filtered view can be bookmarked or shared.
  const query = params.toString();
  useEffect(() => {
    api(`/items${query ? `?${query}` : ''}`).then(setItems).catch(setError);
  }, [query]);

  // Debounce the text search slightly.
  useEffect(() => {
    const t = setTimeout(() => setFilter('q', search.trim()), 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function setFilter(key, value) {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      return next;
    }, { replace: true });
  }

  const active = FILTER_KEYS.some((k) => params.get(k));
  const session = vocab && params.get('session')
    ? vocab.fieldSessions.find((s) => String(s.id) === params.get('session'))
    : null;

  if (error) return <ErrorBox error={error} />;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Items</h1>
          <p className="text-sm text-stone-500">Recordings, photographs, texts and structures held in the archive.</p>
        </div>
        <Link to="/items/new" className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800">
          + Add item
        </Link>
      </div>

      <div className="card mb-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <label className="field-label" htmlFor="q">Search</label>
            <input
              id="q"
              className="input"
              placeholder="Titles and descriptions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <FilterSelect label="Community" value={params.get('community')} onChange={(v) => setFilter('community', v)}
            options={vocab?.communities.map((c) => [c.id, c.name])} />
          <FilterSelect label="Language" value={params.get('language')} onChange={(v) => setFilter('language', v)}
            options={vocab?.languages.map((l) => [l.id, l.name])} />
          <FilterSelect label="Item type" value={params.get('type')} onChange={(v) => setFilter('type', v)}
            options={vocab?.itemTypes.map((t) => [t, TYPE_LABELS[t]])} />
          <FilterSelect label="Access level" value={params.get('access')} onChange={(v) => setFilter('access', v)}
            options={vocab?.accessLevels.map((a) => [a, a.charAt(0) + a.slice(1).toLowerCase()])} />
        </div>
        {active && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            {session && (
              <span className="rounded-full bg-stone-100 px-3 py-1 text-stone-700">
                Field session: {session.place.village}, {new Date(session.date).toLocaleDateString('en-GB', { timeZone: 'UTC' })}
              </span>
            )}
            <button
              className="text-teal-700 hover:underline"
              onClick={() => { setSearch(''); setParams({}, { replace: true }); }}
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {!items ? <Loading /> : (
        <>
          <p className="mb-2 text-sm text-stone-500">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
          {items.length === 0 ? (
            <div className="card p-8 text-center text-sm text-stone-500">No items match these filters.</div>
          ) : (
            <div className="card overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="border-b border-stone-200 bg-stone-50 text-left text-xs uppercase tracking-wider text-stone-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Identifier</th>
                    <th className="px-4 py-3 font-semibold">Title</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Community</th>
                    <th className="px-4 py-3 font-semibold">Language</th>
                    <th className="px-4 py-3 font-semibold">Place</th>
                    <th className="px-4 py-3 font-semibold">Access</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {items.map((it) => (
                    <tr
                      key={it.id}
                      className="cursor-pointer hover:bg-teal-50/50"
                      onClick={() => navigate(`/items/${it.identifier}`)}
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-stone-600">{it.identifier}</td>
                      <td className="px-4 py-3">
                        <Link to={`/items/${it.identifier}`} className="font-medium text-stone-900 hover:text-teal-700"
                          onClick={(e) => e.stopPropagation()}>
                          {it.titleEnglish}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">{TYPE_LABELS[it.itemType]}</td>
                      <td className="px-4 py-3">{it.community.name}</td>
                      <td className="px-4 py-3">{it.language?.name ?? <span className="text-stone-400">—</span>}</td>
                      <td className="px-4 py-3">{placeLabel(it.place)}</td>
                      <td className="px-4 py-3"><AccessBadge level={it.accessLevel} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  const id = `f-${label}`;
  return (
    <div>
      <label className="field-label" htmlFor={id}>{label}</label>
      <select id={id} className="input" value={value || ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">All</option>
        {options?.map(([v, text]) => <option key={v} value={v}>{text}</option>)}
      </select>
    </div>
  );
}
