CREATE TABLE "documents" (
       "id" varchar PRIMARY KEY,
       "file" bytea
);
CREATE TABLE "marginalia" (
       "documents_id" varchar REFERENCES documents (id),
       "users_id" varchar REFERENCES users (id),
       "marginalis" text,
       PRIMARY KEY ("documents_id", "users_id")
);
COMMENT ON COLUMN "marginalia"."marginalis" IS 'JSON string, but unable to use JSON type due to JDBC compatibility"';
CREATE INDEX ON "marginalia" ("users_id");
