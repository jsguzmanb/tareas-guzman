BEGIN;

-- Access is modeled as independent grants so membership revocation does not
-- remove courtesy, beta, or technical access to the same user.
CREATE TYPE "AccessGrantSource" AS ENUM ('MEMBERSHIP', 'COURTESY', 'BETA', 'TECHNICAL');

ALTER TABLE "User"
  ALTER COLUMN "username" DROP NOT NULL,
  ALTER COLUMN "passwordHash" DROP NOT NULL,
  ADD COLUMN "identityEmail" TEXT,
  ADD COLUMN "externalSubject" TEXT,
  ADD COLUMN "updatedAt" TIMESTAMP(3);

UPDATE "User"
SET "updatedAt" = CURRENT_TIMESTAMP
WHERE "updatedAt" IS NULL;

ALTER TABLE "User"
  ALTER COLUMN "updatedAt" SET NOT NULL;

ALTER TABLE "Project" ADD COLUMN "ownerId" TEXT;
ALTER TABLE "Task" ADD COLUMN "ownerId" TEXT;
ALTER TABLE "WeeklyReview" ADD COLUMN "ownerId" TEXT;

-- Fail closed unless the expected legacy owner exists exactly once. Keeping
-- the email out of SQL lets ADMIN_EMAIL link the WordPress identity at seed or
-- first SSO login without committing personal data to migration history.
DO $$
DECLARE
  legacy_owner_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO legacy_owner_count
  FROM "User"
  WHERE "username" = 'juan';

  IF legacy_owner_count <> 1 THEN
    RAISE EXCEPTION
      'Expected exactly one legacy User with username juan, found %',
      legacy_owner_count;
  END IF;
END $$;

UPDATE "Project"
SET "ownerId" = (SELECT "id" FROM "User" WHERE "username" = 'juan')
WHERE "ownerId" IS NULL;

UPDATE "Task"
SET "ownerId" = (SELECT "id" FROM "User" WHERE "username" = 'juan')
WHERE "ownerId" IS NULL;

UPDATE "WeeklyReview"
SET "ownerId" = (SELECT "id" FROM "User" WHERE "username" = 'juan')
WHERE "ownerId" IS NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Project" WHERE "ownerId" IS NULL)
    OR EXISTS (SELECT 1 FROM "Task" WHERE "ownerId" IS NULL)
    OR EXISTS (SELECT 1 FROM "WeeklyReview" WHERE "ownerId" IS NULL) THEN
    RAISE EXCEPTION 'Legacy ownership backfill left rows without an owner';
  END IF;
END $$;

ALTER TABLE "Project" ALTER COLUMN "ownerId" SET NOT NULL;
ALTER TABLE "Task" ALTER COLUMN "ownerId" SET NOT NULL;
ALTER TABLE "WeeklyReview" ALTER COLUMN "ownerId" SET NOT NULL;

CREATE TABLE "AccessGrant" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "source" "AccessGrantSource" NOT NULL,
  "entitlement" TEXT NOT NULL DEFAULT 'tasks',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "sourceStatus" TEXT,
  "sourceUpdatedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AccessGrant_pkey" PRIMARY KEY ("id")
);

INSERT INTO "AccessGrant" (
  "id",
  "userId",
  "source",
  "entitlement",
  "active",
  "sourceStatus",
  "sourceUpdatedAt",
  "createdAt",
  "updatedAt"
)
SELECT
  'legacy-technical-juan',
  "id",
  'TECHNICAL'::"AccessGrantSource",
  'tasks',
  true,
  'legacy-admin',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "User"
WHERE "username" = 'juan';

CREATE TABLE "NotificationPreference" (
  "userId" TEXT NOT NULL,
  "notificationEmail" TEXT NOT NULL,
  "timeZone" TEXT NOT NULL DEFAULT 'UTC',
  "dailyReminderEnabled" BOOLEAN NOT NULL DEFAULT true,
  "dailyReminderHour" INTEGER NOT NULL DEFAULT 8,
  "weeklyReminderEnabled" BOOLEAN NOT NULL DEFAULT true,
  "weeklyReminderWeekday" INTEGER NOT NULL DEFAULT 5,
  "weeklyReminderHour" INTEGER NOT NULL DEFAULT 9,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("userId"),
  CONSTRAINT "NotificationPreference_dailyReminderHour_check"
    CHECK ("dailyReminderHour" BETWEEN 0 AND 23),
  CONSTRAINT "NotificationPreference_weeklyReminderWeekday_check"
    CHECK ("weeklyReminderWeekday" BETWEEN 0 AND 6),
  CONSTRAINT "NotificationPreference_weeklyReminderHour_check"
    CHECK ("weeklyReminderHour" BETWEEN 0 AND 23)
);

CREATE TABLE "ShortcutCredential" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "tokenPrefix" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastUsedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  CONSTRAINT "ShortcutCredential_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConsumedAccessToken" (
  "jti" TEXT NOT NULL,
  "issuer" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConsumedAccessToken_pkey" PRIMARY KEY ("jti")
);

CREATE TABLE "MembershipEvent" (
  "eventId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "entitlement" TEXT NOT NULL DEFAULT 'tasks',
  "active" BOOLEAN NOT NULL,
  "sourceStatus" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "applied" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "MembershipEvent_pkey" PRIMARY KEY ("eventId")
);

DROP INDEX IF EXISTS "User_username_key";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_identityEmail_key" ON "User"("identityEmail");
CREATE UNIQUE INDEX "User_externalSubject_key" ON "User"("externalSubject");

CREATE UNIQUE INDEX "AccessGrant_userId_source_entitlement_key"
  ON "AccessGrant"("userId", "source", "entitlement");
CREATE INDEX "AccessGrant_userId_entitlement_active_idx"
  ON "AccessGrant"("userId", "entitlement", "active");

CREATE UNIQUE INDEX "ShortcutCredential_tokenHash_key"
  ON "ShortcutCredential"("tokenHash");
CREATE INDEX "ShortcutCredential_userId_revokedAt_idx"
  ON "ShortcutCredential"("userId", "revokedAt");

CREATE INDEX "ConsumedAccessToken_expiresAt_idx"
  ON "ConsumedAccessToken"("expiresAt");

CREATE INDEX "MembershipEvent_userId_occurredAt_idx"
  ON "MembershipEvent"("userId", "occurredAt");
CREATE INDEX "MembershipEvent_subject_occurredAt_idx"
  ON "MembershipEvent"("subject", "occurredAt");

CREATE UNIQUE INDEX "Project_id_ownerId_key" ON "Project"("id", "ownerId");
CREATE INDEX "Project_ownerId_archived_createdAt_idx"
  ON "Project"("ownerId", "archived", "createdAt");

CREATE INDEX "Task_ownerId_status_createdAt_idx"
  ON "Task"("ownerId", "status", "createdAt");
CREATE UNIQUE INDEX "Task_id_ownerId_key" ON "Task"("id", "ownerId");
CREATE INDEX "Task_ownerId_projectId_idx"
  ON "Task"("ownerId", "projectId");

CREATE INDEX "WeeklyReview_ownerId_completedAt_idx"
  ON "WeeklyReview"("ownerId", "completedAt");

ALTER TABLE "AccessGrant"
  ADD CONSTRAINT "AccessGrant_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "NotificationPreference"
  ADD CONSTRAINT "NotificationPreference_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ShortcutCredential"
  ADD CONSTRAINT "ShortcutCredential_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MembershipEvent"
  ADD CONSTRAINT "MembershipEvent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Project"
  ADD CONSTRAINT "Project_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Task" DROP CONSTRAINT "Task_projectId_fkey";

ALTER TABLE "Task"
  ADD CONSTRAINT "Task_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Task"
  ADD CONSTRAINT "Task_projectId_ownerId_fkey"
  FOREIGN KEY ("projectId", "ownerId") REFERENCES "Project"("id", "ownerId")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WeeklyReview"
  ADD CONSTRAINT "WeeklyReview_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
