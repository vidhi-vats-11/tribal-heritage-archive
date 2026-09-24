import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { Loading, ErrorBox } from '../components/Loading.jsx';
import { formatDate } from '../format.js';

export default function Sessions() {
  const [sessions, setSessions] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api('/sessions').then(setSessions).catch(setError);
  }, []);

  if (error) return <ErrorBox error={error} />;
  if (!sessions) return <Loading />;

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Field sessions</h1>
      <p className="mb-6 text-sm text-stone-500">
        Each visit to a community, with the consent agreement under which material was recorded.
      </p>

      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-left text-xs uppercase tracking-wider text-stone-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Place</th>
              <th className="px-4 py-3 font-semibold">Community</th>
              <th className="px-4 py-3 font-semibold">Researcher</th>
              <th className="px-4 py-3 font-semibold">Consent ref.</th>
              <th className="px-4 py-3 font-semibold text-right">Items</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {sessions.map((s) => (
              <tr key={s.id} className="align-top">
                <td className="whitespace-nowrap px-4 py-3">{formatDate(s.date)}</td>
                <td className="px-4 py-3">
                  <div className="text-stone-900">{s.place.village}</div>
                  <div className="text-xs text-stone-500">
                    {s.place.tehsil}, {s.place.district}
                    {s.place.isSeasonalSettlement && ' · seasonal settlement'}
                  </div>
                </td>
                <td className="px-4 py-3">{s.community.name}</td>
                <td className="px-4 py-3">{s.researcherName}</td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-stone-600">{s.consentReference}</td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/?session=${s.id}`}
                    className="inline-flex min-w-[2.5rem] justify-center rounded-full bg-teal-50 px-2.5 py-0.5 font-semibold text-teal-800 ring-1 ring-inset ring-teal-600/20 hover:bg-teal-100">
                    {s._count.items}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
