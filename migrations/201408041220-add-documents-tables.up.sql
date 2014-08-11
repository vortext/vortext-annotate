CREATE TABLE "documents" (
       "id" varchar PRIMARY KEY,
       "file" bytea
);
COMMENT ON COLUMN "documents" ("id") IS 'fingerprint produced by PDF.js';

CREATE TABLE "projects" (
       "id" bigserial,
       "users_id" varchar REFERENCES users (id),
       "title" varchar,
       "description text,
       PRIMARY KEY ("id", "users_id")
);
CREATE INDEX ON "projects" ("users_id");

CREATE TABLE "documents_projects" (
       "documents_id" REFERENCES documents (id),
       "projects_id" REFERENCES projects (id),
       PRIMARY KEY ("documents_id", "projects_id")
);

CREATE TABLE "marginalia" (
       "documents_id" varchar REFERENCES documents (id),
       "projects_id" varchar REFERENCES projects (id),
       "marginalis" json,
       PRIMARY KEY ("documents_id", "users_id")
);
CREATE INDEX ON "marginalia" ("projects_id");
