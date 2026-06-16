CREATE TABLE "account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "chunk" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicleId" uuid NOT NULL,
	"documentId" uuid,
	"kind" text NOT NULL,
	"content" text NOT NULL,
	"sourceLabel" text NOT NULL,
	"sourceUrl" text,
	"embedding" vector(1536),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicleId" uuid NOT NULL,
	"kind" text NOT NULL,
	"fileName" text,
	"fileUrl" text,
	"extractedText" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicleId" uuid NOT NULL,
	"service" text NOT NULL,
	"intervalMiles" integer,
	"intervalMonths" integer,
	"dueMileage" integer,
	"dueDate" timestamp,
	"status" text DEFAULT 'ok' NOT NULL,
	"source" text DEFAULT 'curated-intervals' NOT NULL,
	"completedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quote_check" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicleId" uuid NOT NULL,
	"shopName" text,
	"region" text,
	"lineItems" jsonb NOT NULL,
	"totalCents" integer NOT NULL,
	"verdict" text NOT NULL,
	"fairLowCents" integer NOT NULL,
	"fairHighCents" integer NOT NULL,
	"flags" jsonb NOT NULL,
	"summary" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recall_match" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicleId" uuid NOT NULL,
	"source" text NOT NULL,
	"campaignId" text NOT NULL,
	"component" text,
	"summary" text NOT NULL,
	"severity" text DEFAULT 'soon' NOT NULL,
	"remedy" text,
	"consequence" text,
	"status" text DEFAULT 'open' NOT NULL,
	"provenanceUrl" text NOT NULL,
	"reportDate" text,
	"notified" boolean DEFAULT false NOT NULL,
	"foundAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminder" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicleId" uuid,
	"userId" text NOT NULL,
	"kind" text NOT NULL,
	"channel" text DEFAULT 'email' NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"scheduleAt" timestamp NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"payload" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_record" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicleId" uuid NOT NULL,
	"date" timestamp NOT NULL,
	"mileage" integer,
	"type" text NOT NULL,
	"description" text,
	"parts" jsonb,
	"laborHours" real,
	"costCents" integer,
	"source" text DEFAULT 'manual' NOT NULL,
	"receiptUrl" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "symptom_report" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicleId" uuid NOT NULL,
	"input" text,
	"dtcCode" text,
	"causes" jsonb NOT NULL,
	"urgency" text NOT NULL,
	"estLowCents" integer,
	"estHighCents" integer,
	"summary" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"emailVerified" timestamp,
	"image" text,
	"reminderChannel" text DEFAULT 'email' NOT NULL,
	"digestFrequency" text DEFAULT 'weekly' NOT NULL,
	"phone" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"vin" text,
	"year" integer,
	"make" text NOT NULL,
	"model" text NOT NULL,
	"trim" text,
	"engine" text,
	"mileage" integer DEFAULT 0 NOT NULL,
	"nickname" text,
	"isPrimary" boolean DEFAULT false NOT NULL,
	"specs" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chunk" ADD CONSTRAINT "chunk_vehicleId_vehicle_id_fk" FOREIGN KEY ("vehicleId") REFERENCES "public"."vehicle"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chunk" ADD CONSTRAINT "chunk_documentId_document_id_fk" FOREIGN KEY ("documentId") REFERENCES "public"."document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_vehicleId_vehicle_id_fk" FOREIGN KEY ("vehicleId") REFERENCES "public"."vehicle"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_item" ADD CONSTRAINT "maintenance_item_vehicleId_vehicle_id_fk" FOREIGN KEY ("vehicleId") REFERENCES "public"."vehicle"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_check" ADD CONSTRAINT "quote_check_vehicleId_vehicle_id_fk" FOREIGN KEY ("vehicleId") REFERENCES "public"."vehicle"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recall_match" ADD CONSTRAINT "recall_match_vehicleId_vehicle_id_fk" FOREIGN KEY ("vehicleId") REFERENCES "public"."vehicle"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder" ADD CONSTRAINT "reminder_vehicleId_vehicle_id_fk" FOREIGN KEY ("vehicleId") REFERENCES "public"."vehicle"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder" ADD CONSTRAINT "reminder_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_record" ADD CONSTRAINT "service_record_vehicleId_vehicle_id_fk" FOREIGN KEY ("vehicleId") REFERENCES "public"."vehicle"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "symptom_report" ADD CONSTRAINT "symptom_report_vehicleId_vehicle_id_fk" FOREIGN KEY ("vehicleId") REFERENCES "public"."vehicle"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle" ADD CONSTRAINT "vehicle_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chunk_vehicle_idx" ON "chunk" USING btree ("vehicleId");--> statement-breakpoint
CREATE INDEX "chunk_embedding_idx" ON "chunk" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "doc_vehicle_idx" ON "document" USING btree ("vehicleId");--> statement-breakpoint
CREATE INDEX "maint_vehicle_idx" ON "maintenance_item" USING btree ("vehicleId");--> statement-breakpoint
CREATE INDEX "quote_vehicle_idx" ON "quote_check" USING btree ("vehicleId");--> statement-breakpoint
CREATE INDEX "recall_vehicle_idx" ON "recall_match" USING btree ("vehicleId");--> statement-breakpoint
CREATE INDEX "recall_campaign_idx" ON "recall_match" USING btree ("vehicleId","source","campaignId");--> statement-breakpoint
CREATE INDEX "reminder_user_idx" ON "reminder" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "service_vehicle_idx" ON "service_record" USING btree ("vehicleId");--> statement-breakpoint
CREATE INDEX "symptom_vehicle_idx" ON "symptom_report" USING btree ("vehicleId");--> statement-breakpoint
CREATE INDEX "vehicle_user_idx" ON "vehicle" USING btree ("userId");