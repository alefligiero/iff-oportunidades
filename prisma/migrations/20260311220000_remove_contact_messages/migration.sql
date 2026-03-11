-- Remove contact message data and table
DELETE FROM "Notification" WHERE "type" = 'CONTACT_MESSAGE';
DROP TABLE IF EXISTS "ContactMessage";
DROP TYPE IF EXISTS "ContactMessageStatus";

-- Recreate NotificationType enum without CONTACT_MESSAGE
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";

CREATE TYPE "NotificationType" AS ENUM (
  'INTERNSHIP_SUBMITTED',
  'DOCUMENT_SUBMITTED',
  'VACANCY_SUBMITTED',
  'INTERNSHIP_STATUS',
  'DOCUMENT_STATUS',
  'VACANCY_STATUS'
);

ALTER TABLE "Notification"
ALTER COLUMN "type" TYPE "NotificationType"
USING ("type"::text::"NotificationType");

DROP TYPE "NotificationType_old";
