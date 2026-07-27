-- Every portal needs a display name for staff/admin users (only Tenant had
-- one). Table is empty at this point in the build, so no backfill needed.
ALTER TABLE "users" ADD COLUMN "fullName" TEXT NOT NULL;
