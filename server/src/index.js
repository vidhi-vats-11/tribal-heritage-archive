const express = require('express');
const cors = require('cors');
const { PrismaClient, Prisma } = require('@prisma/client');
const { ITEM_TYPES, ACCESS_LEVELS, CONTRIBUTOR_ROLES } = require('./vocab');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 4000;

// Browser origins allowed to call the API, as a comma-separated list, e.g.
// CORS_ORIGINS=https://tribal-heritage-archive.vercel.app,http://localhost:5173
const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);
app.use(cors({ origin: corsOrigins }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));
// MediaFile.sizeBytes is a BigInt, which JSON.stringify cannot handle.
app.set('json replacer', (key, value) => (typeof value === 'bigint' ? value.toString() : value));

// Wrap async handlers so thrown errors reach the error middleware.
const route = (fn) => (req, res, next) => fn(req, res, next).catch(next);

const listInclude = {
  community: true,
  language: true,
  place: true,
};

const detailInclude = {
  ...listInclude,
  fieldSession: { include: { place: true, community: true } },
  mediaFiles: { orderBy: { role: 'asc' } },
  transcript: true,
  subjects: { include: { subject: true } },
  people: { include: { person: true } },
};

// Everything the frontend needs to build dropdowns and filters.
app.get('/api/vocab', route(async (req, res) => {
  const [communities, languages, places, subjects, fieldSessions, lastItem] = await Promise.all([
    prisma.community.findMany({ orderBy: { name: 'asc' } }),
    prisma.language.findMany({ orderBy: { name: 'asc' } }),
    prisma.place.findMany({ orderBy: [{ district: 'asc' }, { village: 'asc' }] }),
    prisma.subject.findMany({ orderBy: { name: 'asc' } }),
    prisma.fieldSession.findMany({ orderBy: { date: 'desc' }, include: { place: true, community: true } }),
    prisma.item.findFirst({ orderBy: { identifier: 'desc' }, select: { identifier: true } }),
  ]);
  res.json({
    communities, languages, places, subjects, fieldSessions,
    itemTypes: ITEM_TYPES,
    accessLevels: ACCESS_LEVELS,
    contributorRoles: CONTRIBUTOR_ROLES,
    nextIdentifier: nextIdentifier(lastItem?.identifier),
  });
}));

function nextIdentifier(last) {
  const year = new Date().getFullYear();
  const m = last && last.match(/^TRB-(\d{4})-(\d{4})$/);
  const n = m && Number(m[1]) === year ? Number(m[2]) + 1 : 1;
  return `TRB-${year}-${String(n).padStart(4, '0')}`;
}

// Items list. All filters are optional and combine with AND.
app.get('/api/items', route(async (req, res) => {
  const { community, language, type, access, session, q } = req.query;
  const where = {};
  if (community) where.communityId = Number(community);
  if (language) where.languageId = Number(language);
  if (type) where.itemType = type;
  if (access) where.accessLevel = access;
  if (session) where.fieldSessionId = Number(session);
  if (q && q.trim()) {
    const term = q.trim();
    where.OR = [
      { titleEnglish: { contains: term } },
      { titleOriginal: { contains: term } },
      { description: { contains: term } },
      { identifier: { contains: term } },
    ];
  }
  const items = await prisma.item.findMany({ where, include: listInclude, orderBy: { identifier: 'asc' } });
  res.json(items);
}));

app.get('/api/items/:identifier', route(async (req, res) => {
  const item = await prisma.item.findUnique({ where: { identifier: req.params.identifier }, include: detailInclude });
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json(item);
}));

app.post('/api/items', route(async (req, res) => {
  const b = req.body || {};
  const errors = {};
  const str = (v) => (typeof v === 'string' ? v.trim() : '');
  const id = (v) => (v === '' || v == null ? null : Number(v));

  const data = {
    identifier: str(b.identifier),
    titleOriginal: str(b.titleOriginal) || null,
    titleEnglish: str(b.titleEnglish),
    description: str(b.description),
    itemType: b.itemType,
    accessLevel: b.accessLevel,
    communityId: id(b.communityId),
    languageId: id(b.languageId),
    placeId: id(b.placeId),
    fieldSessionId: id(b.fieldSessionId),
    durationSeconds: id(b.durationSeconds),
  };

  if (!/^TRB-\d{4}-\d{4}$/.test(data.identifier)) errors.identifier = 'Use the form TRB-YYYY-NNNN';
  if (!data.titleEnglish) errors.titleEnglish = 'Required';
  if (!data.description) errors.description = 'Required';
  if (!ITEM_TYPES.includes(data.itemType)) errors.itemType = 'Choose an item type';
  if (!ACCESS_LEVELS.includes(data.accessLevel)) errors.accessLevel = 'Choose an access level';
  const date = new Date(b.dateRecorded);
  if (!b.dateRecorded || isNaN(date)) errors.dateRecorded = 'Enter a valid date';
  if (data.durationSeconds != null && !(Number.isInteger(data.durationSeconds) && data.durationSeconds >= 0)) {
    errors.durationSeconds = 'Whole number of seconds';
  }

  // Controlled vocabularies: the referenced row must exist.
  const checks = [
    ['communityId', prisma.community, true],
    ['placeId', prisma.place, true],
    ['fieldSessionId', prisma.fieldSession, true],
    ['languageId', prisma.language, false],
  ];
  for (const [field, model, required] of checks) {
    if (data[field] == null) {
      if (required) errors[field] = 'Required';
    } else if (!(await model.findUnique({ where: { id: data[field] } }))) {
      errors[field] = 'Not a known value';
    }
  }

  const subjectIds = Array.isArray(b.subjectIds) ? b.subjectIds.map(Number) : [];
  if (subjectIds.length) {
    const found = await prisma.subject.count({ where: { id: { in: subjectIds } } });
    if (found !== subjectIds.length) errors.subjectIds = 'Unknown subject';
  }

  if (Object.keys(errors).length) return res.status(400).json({ errors });

  try {
    const item = await prisma.item.create({
      data: {
        ...data,
        dateRecorded: date,
        subjects: { create: subjectIds.map((subjectId) => ({ subjectId })) },
      },
    });
    res.status(201).json(item);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return res.status(409).json({ errors: { identifier: 'This identifier is already in use' } });
    }
    throw e;
  }
}));

app.get('/api/sessions', route(async (req, res) => {
  const sessions = await prisma.fieldSession.findMany({
    orderBy: { date: 'asc' },
    include: { place: true, community: true, _count: { select: { items: true } } },
  });
  res.json(sessions);
}));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
