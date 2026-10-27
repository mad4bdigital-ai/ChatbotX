ALTER TABLE "Invitation" ADD COLUMN IF NOT EXISTS "email" text;--> statement-breakpoint
ALTER TABLE "ContactInbox" ADD COLUMN IF NOT EXISTS "username" text;