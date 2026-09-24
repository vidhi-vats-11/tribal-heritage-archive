import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { Loading, ErrorBox } from '../components/Loading.jsx';
import { TYPE_LABELS, formatDate } from '../format.js';
import { ACCESS_HELP } from '../components/AccessBadge.jsx';

const EMPTY = {
  identifier: '',
  titleEnglish: '',
  titleOriginal: '',
  description: '',
  itemType: '',
  dateRecorded: '',
  durationSeconds: '',
  fieldSessionId: '',
  communityId: '',
  languageId: '',
  placeId: '',
  accessLevel: '',
  subjectIds: [],
};

const REQUIRED = ['identifier', 'titleEnglish', 'description', 'itemType', 'dateRecorded', 'fieldSessionId', 'communityId', 'placeId', 'accessLevel'];

export default function AddItem() {
  const [vocab, setVocab] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api('/vocab')
      .then((v) => {
        setVocab(v);
        setForm((f) => ({ ...f, identifier: f.identifier || v.nextIdentifier }));
      })
      .catch(setLoadError);
  }, []);

  // Editing a field clears its error message.
  function clearErrors(...keys) {
    setErrors((errs) => {
      const next = { ...errs };
      keys.forEach((k) => delete next[k]);
      if (Object.keys(next).length === 1 && next._form) delete next._form;
      return next;
    });
  }

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    clearErrors(key);
  };

  // Choosing a field session pre-fills its place and community (still editable).
  function chooseSession(e) {
    const id = e.target.value;
    const s = vocab.fieldSessions.find((x) => String(x.id) === id);
    setForm((f) => ({
      ...f,
      fieldSessionId: id,
      placeId: f.placeId || (s ? String(s.placeId) : ''),
      communityId: f.communityId || (s ? String(s.communityId) : ''),
    }));
    clearErrors('fieldSessionId', 'placeId', 'communityId');
  }

  function toggleSubject(id) {
    setForm((f) => ({
      ...f,
      subjectIds: f.subjectIds.includes(id) ? f.subjectIds.filter((x) => x !== id) : [...f.subjectIds, id],
    }));
  }

  async function submit(e) {
    e.preventDefault();
    const errs = {};
    for (const k of REQUIRED) if (!String(form[k]).trim()) errs[k] = 'Required';
    if (form.identifier && !/^TRB-\d{4}-\d{4}$/.test(form.identifier.trim())) errs.identifier = 'Use the form TRB-YYYY-NNNN';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      const created = await api('/items', { method: 'POST', body: JSON.stringify(form) });
      navigate(`/items/${created.identifier}`);
    } catch (err) {
      setErrors(err.body?.errors || { _form: err.message });
      setSaving(false);
    }
  }

  if (loadError) return <ErrorBox error={loadError} />;
  if (!vocab) return <Loading />;

  const timeBased = form.itemType === 'AUDIO' || form.itemType === 'VIDEO';
  const errorCount = Object.keys(errors).length;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Add item</h1>
      <p className="mb-6 text-sm text-stone-500">
        Community, language, place, type, access level and field session are chosen from controlled lists — never typed.
      </p>

      <form onSubmit={submit} noValidate className="card space-y-8 p-6">
        {errorCount > 0 && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
            {errors._form || 'Please fix the highlighted fields.'}
          </div>
        )}

        <fieldset className="space-y-4">
          <legend className="section-title">Description</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Identifier" name="identifier" required error={errors.identifier} hint="Suggested next number; must be unique.">
              <input id="identifier" className="input font-mono" value={form.identifier} onChange={set('identifier')} />
            </Field>
            <Field label="Date recorded" name="dateRecorded" required error={errors.dateRecorded}>
              <input id="dateRecorded" type="date" className="input" value={form.dateRecorded} onChange={set('dateRecorded')} />
            </Field>
          </div>
          <Field label="Title (English)" name="titleEnglish" required error={errors.titleEnglish}>
            <input id="titleEnglish" className="input" value={form.titleEnglish} onChange={set('titleEnglish')} />
          </Field>
          <Field label="Title (original language)" name="titleOriginal" error={errors.titleOriginal}>
            <input id="titleOriginal" className="input" value={form.titleOriginal} onChange={set('titleOriginal')} />
          </Field>
          <Field label="Description" name="description" required error={errors.description}>
            <textarea id="description" rows={4} className="input" value={form.description} onChange={set('description')} />
          </Field>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="section-title">Classification</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Item type" name="itemType" required error={errors.itemType}>
              <Select id="itemType" value={form.itemType} onChange={set('itemType')}
                options={vocab.itemTypes.map((t) => [t, TYPE_LABELS[t]])} />
            </Field>
            {timeBased ? (
              <Field label="Duration (seconds)" name="durationSeconds" error={errors.durationSeconds}>
                <input id="durationSeconds" type="number" min="0" className="input" value={form.durationSeconds} onChange={set('durationSeconds')} />
              </Field>
            ) : <div className="hidden sm:block" />}
            <Field label="Access level" name="accessLevel" required error={errors.accessLevel}
              hint={form.accessLevel ? ACCESS_HELP[form.accessLevel] : undefined}>
              <Select id="accessLevel" value={form.accessLevel} onChange={set('accessLevel')}
                options={vocab.accessLevels.map((a) => [a, a.charAt(0) + a.slice(1).toLowerCase()])} />
            </Field>
          </div>
          <div>
            <span className="field-label">Subjects</span>
            <div className="flex flex-wrap gap-2">
              {vocab.subjects.map((s) => {
                const on = form.subjectIds.includes(s.id);
                return (
                  <button type="button" key={s.id} onClick={() => toggleSubject(s.id)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition-colors ${
                      on ? 'bg-teal-700 text-white ring-teal-700' : 'bg-white text-stone-600 ring-stone-300 hover:bg-stone-50'
                    }`}>
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="section-title">Provenance</legend>
          <Field label="Field session" name="fieldSessionId" required error={errors.fieldSessionId}
            hint="Choosing a session fills in its place and community; change them if the item came from elsewhere.">
            <Select id="fieldSessionId" value={form.fieldSessionId} onChange={chooseSession}
              options={vocab.fieldSessions.map((s) => [s.id, `${formatDate(s.date)} — ${s.place.village} (${s.community.name}) — ${s.researcherName}`])} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Community" name="communityId" required error={errors.communityId}>
              <Select id="communityId" value={form.communityId} onChange={set('communityId')}
                options={vocab.communities.map((c) => [c.id, c.name])} />
            </Field>
            <Field label="Language" name="languageId" error={errors.languageId}>
              <Select id="languageId" value={form.languageId} onChange={set('languageId')} emptyLabel="None (no speech)"
                options={vocab.languages.map((l) => [l.id, l.name])} />
            </Field>
            <Field label="Place" name="placeId" required error={errors.placeId}>
              <Select id="placeId" value={form.placeId} onChange={set('placeId')}
                options={vocab.places.map((p) => [p.id, `${p.village}, ${p.district}${p.isSeasonalSettlement ? ' (seasonal)' : ''}`])} />
            </Field>
          </div>
        </fieldset>

        <div className="flex items-center justify-end gap-3 border-t border-stone-200 pt-6">
          <button type="button" onClick={() => navigate('/')} className="rounded-md px-4 py-2 text-sm text-stone-600 hover:bg-stone-100">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="rounded-md bg-teal-700 px-5 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60">
            {saving ? 'Saving…' : 'Save item'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, name, required, error, hint, children }) {
  return (
    <div>
      <label htmlFor={name} className="field-label">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      <div className={error ? '[&_.input]:border-red-500 [&_.input]:ring-red-500' : ''}>{children}</div>
      {error ? <p className="mt-1 text-xs text-red-700">{error}</p> : hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </div>
  );
}

function Select({ id, value, onChange, options, emptyLabel = 'Select…' }) {
  return (
    <select id={id} className="input" value={value} onChange={onChange}>
      <option value="">{emptyLabel}</option>
      {options.map(([v, text]) => <option key={v} value={v}>{text}</option>)}
    </select>
  );
}
