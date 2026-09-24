-- CreateTable
CREATE TABLE "Community" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Language" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Place" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "village" TEXT NOT NULL,
    "tehsil" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "isSeasonalSettlement" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Person" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "FieldSession" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "placeId" INTEGER NOT NULL,
    "communityId" INTEGER NOT NULL,
    "researcherName" TEXT NOT NULL,
    "consentReference" TEXT NOT NULL,
    "notes" TEXT,
    CONSTRAINT "FieldSession_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FieldSession_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Item" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "identifier" TEXT NOT NULL,
    "titleOriginal" TEXT,
    "titleEnglish" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "dateRecorded" DATETIME NOT NULL,
    "accessLevel" TEXT NOT NULL,
    "durationSeconds" INTEGER,
    "fieldSessionId" INTEGER NOT NULL,
    "placeId" INTEGER NOT NULL,
    "communityId" INTEGER NOT NULL,
    "languageId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Item_fieldSessionId_fkey" FOREIGN KEY ("fieldSessionId") REFERENCES "FieldSession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Item_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Item_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Item_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MediaFile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "itemId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "checksum" TEXT NOT NULL,
    CONSTRAINT "MediaFile_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transcript" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "itemId" INTEGER NOT NULL,
    "textOriginal" TEXT NOT NULL,
    "textTransliteration" TEXT,
    "textTranslation" TEXT,
    CONSTRAINT "Transcript_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ItemSubject" (
    "itemId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,

    PRIMARY KEY ("itemId", "subjectId"),
    CONSTRAINT "ItemSubject_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ItemSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ItemPerson" (
    "itemId" INTEGER NOT NULL,
    "personId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,

    PRIMARY KEY ("itemId", "personId", "role"),
    CONSTRAINT "ItemPerson_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ItemPerson_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Community_name_key" ON "Community"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Language_name_key" ON "Language"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Place_village_tehsil_district_key" ON "Place"("village", "tehsil", "district");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_name_key" ON "Subject"("name");

-- CreateIndex
CREATE INDEX "FieldSession_placeId_idx" ON "FieldSession"("placeId");

-- CreateIndex
CREATE INDEX "FieldSession_communityId_idx" ON "FieldSession"("communityId");

-- CreateIndex
CREATE UNIQUE INDEX "Item_identifier_key" ON "Item"("identifier");

-- CreateIndex
CREATE INDEX "Item_fieldSessionId_idx" ON "Item"("fieldSessionId");

-- CreateIndex
CREATE INDEX "Item_communityId_idx" ON "Item"("communityId");

-- CreateIndex
CREATE INDEX "Item_languageId_idx" ON "Item"("languageId");

-- CreateIndex
CREATE INDEX "Item_placeId_idx" ON "Item"("placeId");

-- CreateIndex
CREATE INDEX "Item_itemType_idx" ON "Item"("itemType");

-- CreateIndex
CREATE INDEX "Item_accessLevel_idx" ON "Item"("accessLevel");

-- CreateIndex
CREATE INDEX "MediaFile_itemId_idx" ON "MediaFile"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "MediaFile_itemId_role_filePath_key" ON "MediaFile"("itemId", "role", "filePath");

-- CreateIndex
CREATE UNIQUE INDEX "Transcript_itemId_key" ON "Transcript"("itemId");

-- CreateIndex
CREATE INDEX "ItemSubject_subjectId_idx" ON "ItemSubject"("subjectId");

-- CreateIndex
CREATE INDEX "ItemPerson_personId_idx" ON "ItemPerson"("personId");
