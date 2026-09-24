import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import AccessBadge, { ACCESS_HELP } from '../components/AccessBadge.jsx';
import { Loading, ErrorBox } from '../components/Loading.jsx';
import { TYPE_LABELS, formatDate, formatDuration, formatBytes, titleCase } from '../format.js';

export default function ItemDetail() {
  const { identifier } = useParams();
  const [item, setItem] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setItem(null);
    setError(null);
    api(`/items/${identifier}`).then(setItem).catch(setError);
  }, [identifier]);

  if (error) {
    return error.status === 404
      ? <p className="text-stone-600">No item with identifier <span className="font-mono">{identifier}</span>. <Link to="/" className="text-teal-700 underline">Back to items</Link></p>
      : <ErrorBox error={error} />;
  }
  if (!item) return <Loading />;

  const accessCopy = item.mediaFiles.find((f) => f.role === 'ACCESS');
  const session = item.fieldSession;

  return (
    <div className="space-y-6">
      <Link to="/" className="text-sm text-teal-700 hover:underline">← All items</Link>

      {/* Header */}
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-sm text-stone-500">{item.identifier} · {TYPE_LABELS[item.itemType]}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900">{item.titleEnglish}</h1>
            {item.titleOriginal && <p className="mt-1 text-stone-500 italic">{item.titleOriginal}</p>}
          </div>
          <div className="text-right">
            <AccessBadge level={item.accessLevel} large />
            <p className="mt-2 max-w-xs text-xs text-stone-500">{ACCESS_HELP[item.accessLevel]}</p>
          </div>
        </div>
        <p className="mt-4 max-w-3xl leading-relaxed text-stone-700">{item.description}</p>

        {item.subjects.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {item.subjects.map(({ subject }) => (
              <span key={subject.id} className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800 ring-1 ring-inset ring-teal-600/20">
                {subject.name}
              </span>
            ))}
          </div>
        )}

        {item.itemType === 'AUDIO' && (
          <div className="mt-6 rounded-md bg-stone-50 p-4">
            {accessCopy ? (
              <>
                <audio controls preload="metadata" src={accessCopy.filePath} className="w-full" />
                <p className="mt-2 text-xs text-stone-500">
                  Playing the access copy. The demo uses a short generated tune in place of the real recording.
                </p>
              </>
            ) : (
              <p className="text-sm text-stone-500">No access copy available for playback.</p>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Metadata */}
        <div className="card p-6 lg:col-span-2">
          <h2 className="section-title">Details</h2>
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <Field label="Community">{item.community.name}</Field>
            <Field label="Language">{item.language?.name ?? '—'}</Field>
            <Field label="Place">
              {item.place.village}, {item.place.tehsil} tehsil, {item.place.district}
              {item.place.isSeasonalSettlement && (
                <span className="ml-2 rounded bg-stone-100 px-1.5 py-0.5 text-xs text-stone-600">seasonal settlement</span>
              )}
            </Field>
            <Field label="Date recorded">{formatDate(item.dateRecorded)}</Field>
            {item.durationSeconds != null && <Field label="Duration">{formatDuration(item.durationSeconds)}</Field>}
            <Field label="Item type">{TYPE_LABELS[item.itemType]}</Field>
          </dl>

          <h2 className="section-title mt-8">Field session</h2>
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <Field label="Date">{formatDate(session.date)}</Field>
            <Field label="Researcher">{session.researcherName}</Field>
            <Field label="Session place">{session.place.village}, {session.place.district}</Field>
            <Field label="Session community">{session.community.name}</Field>
            <Field label="Consent reference"><span className="font-mono text-sm">{session.consentReference}</span></Field>
            <Field label="Items from this session">
              <Link to={`/?session=${session.id}`} className="text-teal-700 hover:underline">View all →</Link>
            </Field>
          </dl>
          {session.notes && <p className="mt-4 text-sm leading-relaxed text-stone-600">{session.notes}</p>}
        </div>

        {/* Contributors */}
        <div className="card p-6">
          <h2 className="section-title">Contributors</h2>
          {item.people.length === 0 ? (
            <p className="text-sm text-stone-500">None recorded.</p>
          ) : (
            <ul className="space-y-3">
              {item.people.map(({ person, role }) => (
                <li key={`${person.id}-${role}`} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-stone-800">{person.name}</span>
                  <span className="rounded bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">{titleCase(role)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Transcript */}
      {item.transcript && (
        <div className="card p-6">
          <h2 className="section-title">Transcript</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <TranscriptColumn heading="Original" text={item.transcript.textOriginal} />
            <TranscriptColumn heading="Transliteration" text={item.transcript.textTransliteration} />
            <TranscriptColumn heading="English translation" text={item.transcript.textTranslation} />
          </div>
        </div>
      )}

      {/* Media files */}
      <div className="card overflow-x-auto p-6">
        <h2 className="section-title">Media files</h2>
        {item.mediaFiles.length === 0 ? (
          <p className="text-sm text-stone-500">No files registered.</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-stone-500">
              <tr>
                <th className="py-2 pr-4 font-semibold">Role</th>
                <th className="py-2 pr-4 font-semibold">Format</th>
                <th className="py-2 pr-4 font-semibold">Path</th>
                <th className="py-2 pr-4 font-semibold text-right">Size</th>
                <th className="py-2 font-semibold">Checksum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {item.mediaFiles.map((f) => (
                <tr key={f.id}>
                  <td className="py-2 pr-4">{titleCase(f.role)}</td>
                  <td className="py-2 pr-4">{f.format}</td>
                  <td className="py-2 pr-4 font-mono text-xs text-stone-600">{f.filePath}</td>
                  <td className="whitespace-nowrap py-2 pr-4 text-right tabular-nums">{formatBytes(f.sizeBytes)}</td>
                  <td className="py-2 font-mono text-xs text-stone-500" title={f.checksum}>
                    {f.checksum.slice(0, 19)}…
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-medium text-stone-500">{label}</dt>
      <dd className="mt-0.5 text-stone-800">{children}</dd>
    </div>
  );
}

function TranscriptColumn({ heading, text }) {
  return (
    <div className="rounded-md border border-stone-200 bg-stone-50 p-4">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500">{heading}</h3>
      <p className="whitespace-pre-line text-sm leading-relaxed text-stone-800">
        {text || <span className="text-stone-400">—</span>}
      </p>
    </div>
  );
}
