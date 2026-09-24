# Tribal Heritage Archive

A working prototype of a digital archive for cultural heritage material
(songs, interviews, photographs, texts and traditional buildings) documented
with tribal communities in Jammu & Kashmir, including the Gujjar, Bakarwal,
Gaddi, Sippi and Bot communities.

> **All data in this repository is invented placeholder content.** The people,
> villages, descriptions and translations are made up. Original-language
> transcript fields hold clearly labelled placeholder text. The audio is a
> short generated tune. Nothing is taken from any real archive, recording or
> person.

## Why it exists

Material recorded in the field (a migration song sung the night before the
move to summer pastures, an elder describing grazing rights) is only useful
to a community or a researcher if it can be found again, trusted and
shared on the right terms. That means every item needs a record of where it
came from, who took part, what consent was given and who may access it.

This prototype shows one way to structure that: a clear data model, a
browsable catalogue, and a form that keeps new entries consistent. It is
deliberately small. There are no user accounts and no file uploads, and it
runs entirely offline on a laptop.

## The data model, in plain English

Every **item** (a recording, a photograph, a document, a building) is linked
to the **field session** it came from: one dated visit to a place, by a named
researcher, under a recorded consent agreement. So for any item you can
always answer "where did this come from, and on what terms?"

The item's **community, language, place and subjects** are never typed in as
free text. Each is kept in its own table, which works as an official list, and
an item simply points to an entry on that list. This matters more than it
sounds. If people type names by hand, the same community ends up spelled three
ways ("Bakarwal", "Bakkarwal", "bakarwal"), and a search for one misses the
others. With a single list, "Bakarwal" exists exactly once. Every item links to
that one entry, searches and counts are always complete, and if a spelling
ever needs correcting it is fixed in one place and every item follows.

The same idea applies to **people**, with a note of what each person did on
each item (performer, recordist, translator), so one person can hold several
roles. **Media files** are not stored in the database. The database records
where each file lives (master copy, listening copy, thumbnail), its size, and a
**checksum**, a digital fingerprint that shows whether a file has been damaged
or altered over time. Each item also carries an **access level** (Public,
Researcher, Community or Restricted), so material a community wants kept
private is clearly marked as such.

```
Community ─┐                    ┌─ MediaFile    (MASTER / ACCESS / THUMBNAIL, path, size, checksum)
Language  ─┼─< Item >───────────┼─ Transcript   (original, transliteration, translation)
Place     ─┤     │              ├─< ItemSubject >─ Subject
           │     │              └─< ItemPerson (role) >─ Person
           └─< FieldSession (date, researcher, consent reference)
```

<details>
<summary>Technical notes on the model</summary>

- **An item has its own place and community, separate from its session's.** A
  session can capture material from a neighbouring village or group. In the
  seed data, a Gaddi session in Kathua also recorded a Sippi wedding song.
- **Language is optional,** because photographs and building records have no
  spoken language.
- **Item type, access level and roles are text columns checked against fixed
  lists** in `server/src/vocab.js`. Prisma 5 has no enum type for SQLite. On
  PostgreSQL these would be native enums.
- **`MediaFile.sizeBytes` is a 64-bit `BigInt`,** because video masters easily
  exceed 2 GB. The API sends it as a string, because JSON numbers cannot safely
  hold 64-bit values.
- **Access-copy checksums are real SHA-256 hashes** of the bundled WAV files.
  Master files are not shipped, so their checksums are placeholders.
- **The schema is in [`server/prisma/schema.prisma`](server/prisma/schema.prisma)**
  and the demo data is in [`server/prisma/seed.js`](server/prisma/seed.js).

</details>

## The four screens

1. **Items** (home page): the whole catalogue with identifier, title, type,
   community, language, place and a coloured access badge (green = Public,
   blue = Researcher, amber = Community, red = Restricted). You can filter by
   community, language, item type and access level, and search titles and
   descriptions. Filters combine, and they are kept in the web address, so a
   filtered view can be bookmarked.
2. **Item detail**: the full record. It includes an audio player for audio
   items, the transcript shown as original, transliteration and English side
   by side, contributors and their roles, subject tags, the field session and
   consent reference, and the list of media files with checksums.
3. **Add item**: a form where community, language, place, item type, access
   level and field session are all chosen from dropdowns, never typed. Required
   fields are checked, and saving opens the new item's page.
4. **Field sessions**: every visit with its date, place, community, researcher,
   consent reference and the number of items it produced. Click the number to
   see those items.

## Running it

You need **Node.js 18 or newer** and **npm**.

Run `npm install` once while online. It downloads Prisma's database engine.
After that the app runs completely offline.

```bash
git clone https://github.com/vidhi-vats-11/tribal-heritage-archive.git
cd tribal-heritage-archive

# Terminal 1: API on http://localhost:4000
cd server
npm install
npm run dev          # first run creates and seeds the SQLite database automatically

# Terminal 2: web app on http://localhost:5173
cd client
npm install
npm run dev
```

Then open **http://localhost:5173**.

**Reset the demo data** (for example after adding test items):

```bash
cd server
npm run setup        # rebuilds the database from the migrations and re-seeds it
```

## Stack

| Part     | Technology                                   |
|----------|----------------------------------------------|
| Server   | Node.js, Express, Prisma ORM                 |
| Database | SQLite (a single local file, no server needed) |
| Client   | React, Vite, Tailwind CSS, React Router      |

### API

| Method | Path                     | Purpose                                                        |
|--------|--------------------------|----------------------------------------------------------------|
| GET    | `/api/items`             | List items. Optional filters: `community`, `language`, `type`, `access`, `session`, `q` |
| GET    | `/api/items/:identifier` | Full record, e.g. `/api/items/TRB-2025-0001`                   |
| POST   | `/api/items`             | Create an item. Invalid input returns field-by-field `errors`  |
| GET    | `/api/sessions`          | Field sessions with item counts                                |
| GET    | `/api/vocab`             | All controlled lists, used to fill dropdowns and filters       |

### Layout

```
server/
  prisma/schema.prisma        data model
  prisma/migrations/          database migrations
  prisma/seed.js              invented demo data
  src/index.js                Express API
  src/vocab.js                allowed values for item type, access level and roles
  scripts/ensure-db.js        creates and seeds the database on first run
  scripts/generate-audio.js   regenerates the two sample audio files
client/
  public/audio/               two short generated WAV files for offline playback
  src/pages/                  Items, Item detail, Add item, Field sessions
```

## Licence

[MIT](LICENSE). The demo data is invented placeholder content and describes
no real people or recordings.
