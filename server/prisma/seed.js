// Seed data for the Tribal Heritage Archive demo.
// EVERY record here is an invented placeholder: people, villages, song texts
// and descriptions are made up for demonstration and are not taken from any
// real archive or collection.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Original-script text is deliberately NOT invented: text in Gojri, Dogri or
// Urdu that no speaker has checked could read as nonsense or give offence.
// These placeholders show where verified text would go.
const ORIGINAL_PLACEHOLDER = '[Original-language transcript — placeholder text, not real content]';
const TRANSLIT_PLACEHOLDER = '[Romanised transliteration — placeholder text, not real content]';
const TITLE_PLACEHOLDER = '[Original-language title — placeholder]';

const AUDIO_DIR = path.join(__dirname, '..', '..', 'client', 'public', 'audio');

// Real size + checksum for the sample audio files that ship with the client.
function accessFile(fileName) {
  const full = path.join(AUDIO_DIR, fileName);
  const buf = fs.existsSync(full) ? fs.readFileSync(full) : Buffer.alloc(0);
  return {
    role: 'ACCESS',
    format: 'WAV',
    filePath: `/audio/${fileName}`,
    sizeBytes: BigInt(buf.length),
    checksum: 'sha256:' + crypto.createHash('sha256').update(buf).digest('hex'),
  };
}

// Master files are not shipped with the demo; the record shows what the
// archive would hold. The checksum is a deterministic placeholder.
function masterFile(identifier, format, sizeBytes) {
  const ext = format.toLowerCase();
  return {
    role: 'MASTER',
    format,
    filePath: `masters/${identifier}.${ext}`,
    sizeBytes: BigInt(sizeBytes),
    checksum: 'sha256:' + crypto.createHash('sha256').update(`placeholder:${identifier}`).digest('hex'),
  };
}

async function main() {
  // Runs on every build and start in production, so skip if the database
  // already holds data. `npm run setup` still rebuilds from scratch because
  // `prisma migrate reset` empties the database before seeding.
  if (!process.argv.includes('--force') && (await prisma.item.count()) > 0) {
    console.log('Database already seeded, skipping.');
    return;
  }

  // Clear in dependency order so a forced seed can be re-run.
  await prisma.itemPerson.deleteMany();
  await prisma.itemSubject.deleteMany();
  await prisma.transcript.deleteMany();
  await prisma.mediaFile.deleteMany();
  await prisma.item.deleteMany();
  await prisma.fieldSession.deleteMany();
  await prisma.person.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.place.deleteMany();
  await prisma.language.deleteMany();
  await prisma.community.deleteMany();

  // ---- Controlled vocabularies -------------------------------------------
  const community = {};
  for (const name of ['Gujjar', 'Bakarwal', 'Gaddi', 'Sippi', 'Bot']) {
    community[name] = await prisma.community.create({ data: { name } });
  }

  const language = {};
  for (const name of ['Gojri', 'Pahari', 'Dogri', 'Kashmiri', 'Urdu']) {
    language[name] = await prisma.language.create({ data: { name } });
  }

  const subject = {};
  for (const name of ['migration', 'marriage ritual', 'funerary rite', 'lullaby', 'pasture rights', 'oral history']) {
    subject[name] = await prisma.subject.create({ data: { name } });
  }

  // Village names are invented; districts/tehsils give regional context only.
  const placeRows = {
    chakDhera:   { village: 'Chak Dhera',     tehsil: 'Thanamandi', district: 'Rajouri',   isSeasonalSettlement: false },
    dhokBanser:  { village: 'Dhok Banser',    tehsil: 'Mendhar',    district: 'Poonch',    isSeasonalSettlement: true },
    behakNilsar: { village: 'Behak Nilsar',   tehsil: 'Kangan',     district: 'Ganderbal', isSeasonalSettlement: true },
    galharKothi: { village: 'Galhar Kothi',   tehsil: 'Bani',       district: 'Kathua',    isSeasonalSettlement: false },
    ramkotDhar:  { village: 'Ramkot Dhar',    tehsil: 'Chenani',    district: 'Udhampur',  isSeasonalSettlement: false },
    lungsar:     { village: 'Lungsar',        tehsil: 'Paddar',     district: 'Kishtwar',  isSeasonalSettlement: false },
  };
  const place = {};
  for (const [key, data] of Object.entries(placeRows)) {
    place[key] = await prisma.place.create({ data });
  }

  const personRows = {
    raina:   { name: 'Dr. Meera Raina (placeholder)',   role: 'RESEARCHER' },
    arif:    { name: 'Arif Hussain (placeholder)',       role: 'RESEARCHER' },
    nasreen: { name: 'Nasreen Akhtar (placeholder)',     role: 'TRANSLATOR' },
    rahim:   { name: 'Rahim Bakhsh (placeholder)',       role: 'PERFORMER' },
    sakina:  { name: 'Sakina Bibi (placeholder)',        role: 'PERFORMER' },
    qadir:   { name: 'Ghulam Qadir (placeholder)',       role: 'INFORMANT' },
    kamla:   { name: 'Kamla Devi (placeholder)',         role: 'PERFORMER' },
    bhagat:  { name: 'Bhagat Ram (placeholder)',         role: 'INFORMANT' },
    dolma:   { name: 'Tsering Dolma (placeholder)',      role: 'INFORMANT' },
    vikram:  { name: 'Vikram Singh (placeholder)',       role: 'TRANSLATOR' },
  };
  const person = {};
  for (const [key, data] of Object.entries(personRows)) {
    person[key] = await prisma.person.create({ data });
  }

  // ---- Field sessions -----------------------------------------------------
  const s1 = await prisma.fieldSession.create({
    data: {
      date: new Date('2025-04-18'),
      placeId: place.chakDhera.id,
      communityId: community.Gujjar.id,
      researcherName: 'Dr. Meera Raina (placeholder)',
      consentReference: 'CONSENT-2025-001',
      notes: 'Spring visit before the upward migration. Recorded songs and an interview on grazing routes. Oral consent recorded on tape; written form signed by the family head.',
    },
  });
  const s2 = await prisma.fieldSession.create({
    data: {
      date: new Date('2025-06-09'),
      placeId: place.behakNilsar.id,
      communityId: community.Bakarwal.id,
      researcherName: 'Arif Hussain (placeholder)',
      consentReference: 'CONSENT-2025-002',
      notes: 'Summer pasture camp. Wedding preparations under way; the family agreed to video of public parts only.',
    },
  });
  const s3 = await prisma.fieldSession.create({
    data: {
      date: new Date('2025-08-21'),
      placeId: place.galharKothi.id,
      communityId: community.Gaddi.id,
      researcherName: 'Dr. Meera Raina (placeholder)',
      consentReference: 'CONSENT-2025-003',
      notes: 'Documentation of house construction. A Sippi family from a neighbouring village also contributed a wedding song.',
    },
  });
  const s4 = await prisma.fieldSession.create({
    data: {
      date: new Date('2025-09-30'),
      placeId: place.lungsar.id,
      communityId: community.Bot.id,
      researcherName: 'Arif Hussain (placeholder)',
      consentReference: 'CONSENT-2025-004',
      notes: 'Short visit. Elders asked that material about funerary practice be restricted to community members.',
    },
  });

  // ---- Items --------------------------------------------------------------
  const song = accessFile('sample-song.wav');
  const speech = accessFile('sample-speech.wav');

  const items = [
    {
      identifier: 'TRB-2025-0001',
      titleOriginal: TITLE_PLACEHOLDER,
      titleEnglish: 'Song of the Road to the High Pastures',
      description: 'A migration song sung by a Gujjar herder on the eve of the spring move to the upper pastures. The verses name the stages of the route and the animals that go ahead.',
      itemType: 'AUDIO', accessLevel: 'PUBLIC', durationSeconds: 214,
      dateRecorded: '2025-04-18', session: s1, place: place.chakDhera, community: 'Gujjar', language: 'Gojri',
      subjects: ['migration'],
      people: [['rahim', 'PERFORMER'], ['raina', 'RECORDIST'], ['nasreen', 'TRANSLATOR']],
      media: [masterFile('TRB-2025-0001', 'WAV', 37_800_000), song],
      transcript: {
        textOriginal: ORIGINAL_PLACEHOLDER,
        textTransliteration: TRANSLIT_PLACEHOLDER,
        textTranslation: 'Come, friends, to the high pastures; the snow on the mountains has melted.\nThe herd walks on ahead, and we follow behind.',
      },
    },
    {
      identifier: 'TRB-2025-0002',
      titleOriginal: null,
      titleEnglish: 'Interview with an Elder on Grazing Rights',
      description: 'An elder describes how families traditionally shared grazing grounds along the migration route and how disputes were settled within the community.',
      itemType: 'AUDIO', accessLevel: 'RESEARCHER', durationSeconds: 1265,
      dateRecorded: '2025-04-18', session: s1, place: place.chakDhera, community: 'Gujjar', language: 'Urdu',
      subjects: ['pasture rights', 'oral history', 'migration'],
      people: [['qadir', 'INFORMANT'], ['raina', 'RECORDIST'], ['nasreen', 'TRANSCRIBER']],
      media: [masterFile('TRB-2025-0002', 'WAV', 223_000_000), speech],
      transcript: {
        textOriginal: ORIGINAL_PLACEHOLDER,
        textTransliteration: TRANSLIT_PLACEHOLDER,
        textTranslation: 'Our elders went up by this same route every year.\nEach family’s pasture was fixed, and this was accepted by word of mouth.',
      },
    },
    {
      identifier: 'TRB-2025-0003',
      titleOriginal: null,
      titleEnglish: 'Summer Huts at a Seasonal Settlement',
      description: 'Photograph of mud-and-timber huts at a high-altitude seasonal settlement, taken in early summer after families arrived with their livestock.',
      itemType: 'PHOTOGRAPH', accessLevel: 'PUBLIC', durationSeconds: null,
      dateRecorded: '2025-04-20', session: s1, place: place.dhokBanser, community: 'Gujjar', language: null,
      subjects: ['migration'],
      people: [['raina', 'PHOTOGRAPHER']],
      media: [masterFile('TRB-2025-0003', 'TIFF', 96_500_000)],
    },
    {
      identifier: 'TRB-2025-0004',
      titleOriginal: null,
      titleEnglish: 'Lullaby at the Summer Camp',
      description: 'A mother sings a lullaby inside a tent at the summer camp. The family asked that it be shared only within the community.',
      itemType: 'AUDIO', accessLevel: 'COMMUNITY', durationSeconds: 98,
      dateRecorded: '2025-06-09', session: s2, place: place.behakNilsar, community: 'Bakarwal', language: 'Gojri',
      subjects: ['lullaby'],
      people: [['sakina', 'PERFORMER'], ['arif', 'RECORDIST']],
      media: [masterFile('TRB-2025-0004', 'WAV', 17_300_000), song],
    },
    {
      identifier: 'TRB-2025-0005',
      titleOriginal: null,
      titleEnglish: 'Henna Night Preparations',
      description: 'Video of the public part of a henna evening before a wedding: women gathering, singing and preparing the henna. Private family moments were not filmed.',
      itemType: 'VIDEO', accessLevel: 'RESEARCHER', durationSeconds: 742,
      dateRecorded: '2025-06-10', session: s2, place: place.behakNilsar, community: 'Bakarwal', language: 'Kashmiri',
      subjects: ['marriage ritual'],
      people: [['arif', 'RECORDIST']],
      media: [masterFile('TRB-2025-0005', 'MOV', 4_120_000_000)],
    },
    {
      identifier: 'TRB-2025-0006',
      titleOriginal: null,
      titleEnglish: 'Traditional Two-Storey Village House',
      description: 'Record of a traditional house with a slate roof and walls of alternating stone and timber courses. Livestock are kept on the ground floor and the family lives above. Includes measured sketch and photographs.',
      itemType: 'BUILT_STRUCTURE', accessLevel: 'PUBLIC', durationSeconds: null,
      dateRecorded: '2025-08-21', session: s3, place: place.galharKothi, community: 'Gaddi', language: null,
      subjects: ['oral history'],
      people: [['bhagat', 'INFORMANT'], ['raina', 'PHOTOGRAPHER']],
      media: [masterFile('TRB-2025-0006', 'TIFF', 142_000_000)],
    },
    {
      identifier: 'TRB-2025-0007',
      titleOriginal: TITLE_PLACEHOLDER,
      titleEnglish: 'Song for the Bride’s Henna',
      description: 'A wedding song sung by women while henna is applied to the bride’s hands. Recorded with a Sippi family visiting from a neighbouring village.',
      itemType: 'AUDIO', accessLevel: 'COMMUNITY', durationSeconds: 186,
      dateRecorded: '2025-08-22', session: s3, place: place.ramkotDhar, community: 'Sippi', language: 'Dogri',
      subjects: ['marriage ritual'],
      people: [['kamla', 'PERFORMER'], ['raina', 'RECORDIST'], ['vikram', 'TRANSLATOR']],
      media: [masterFile('TRB-2025-0007', 'WAV', 32_800_000), song],
      transcript: {
        textOriginal: ORIGINAL_PLACEHOLDER,
        textTransliteration: TRANSLIT_PLACEHOLDER,
        textTranslation: 'Henna is on the bride’s hands, the moon has risen in the sky.\nHer friends are singing; today the courtyard is full.',
      },
    },
    {
      identifier: 'TRB-2025-0008',
      titleOriginal: null,
      titleEnglish: 'Account of Life in the Old Village',
      description: 'Typed transcription of a conversation with an elder about the village before the road was built: seasonal work, trade trips and family history.',
      itemType: 'TEXT', accessLevel: 'RESEARCHER', durationSeconds: null,
      dateRecorded: '2025-08-23', session: s3, place: place.galharKothi, community: 'Gaddi', language: 'Pahari',
      subjects: ['oral history'],
      people: [['bhagat', 'INFORMANT'], ['vikram', 'TRANSCRIBER']],
      media: [masterFile('TRB-2025-0008', 'PDF', 1_450_000)],
    },
    {
      identifier: 'TRB-2025-0009',
      titleOriginal: null,
      titleEnglish: 'Description of Mourning Customs',
      description: 'An elder explains the customs observed after a death in the family. Restricted at the request of community elders; not for public listening.',
      itemType: 'AUDIO', accessLevel: 'RESTRICTED', durationSeconds: 1540,
      dateRecorded: '2025-09-30', session: s4, place: place.lungsar, community: 'Bot', language: 'Urdu',
      subjects: ['funerary rite', 'oral history'],
      people: [['dolma', 'INFORMANT'], ['arif', 'RECORDIST']],
      media: [masterFile('TRB-2025-0009', 'WAV', 271_000_000), speech],
    },
    {
      identifier: 'TRB-2025-0010',
      titleOriginal: null,
      titleEnglish: 'Terraced Fields Above the Village',
      description: 'Photograph of terraced barley fields and stone field walls above the village in late September, shortly after harvest.',
      itemType: 'PHOTOGRAPH', accessLevel: 'RESTRICTED', durationSeconds: null,
      dateRecorded: '2025-09-30', session: s4, place: place.lungsar, community: 'Bot', language: null,
      subjects: ['oral history'],
      people: [['arif', 'PHOTOGRAPHER']],
      media: [masterFile('TRB-2025-0010', 'TIFF', 88_200_000)],
    },
  ];

  for (const it of items) {
    await prisma.item.create({
      data: {
        identifier: it.identifier,
        titleOriginal: it.titleOriginal,
        titleEnglish: it.titleEnglish,
        description: it.description,
        itemType: it.itemType,
        accessLevel: it.accessLevel,
        durationSeconds: it.durationSeconds,
        dateRecorded: new Date(it.dateRecorded),
        fieldSessionId: it.session.id,
        placeId: it.place.id,
        communityId: community[it.community].id,
        languageId: it.language ? language[it.language].id : null,
        mediaFiles: { create: it.media },
        transcript: it.transcript ? { create: it.transcript } : undefined,
        subjects: { create: it.subjects.map((s) => ({ subjectId: subject[s].id })) },
        people: { create: it.people.map(([p, role]) => ({ personId: person[p].id, role })) },
      },
    });
  }

  console.log(`Seeded ${items.length} items across 4 field sessions.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
