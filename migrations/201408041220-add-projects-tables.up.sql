CREATE TABLE "documents" (
       "id" varchar PRIMARY KEY,
       "file" oid
);
COMMENT ON COLUMN "documents".id IS 'fingerprint produced by PDF.js';

CREATE TABLE "projects" (
       "id" bigserial PRIMARY KEY,
       "title" varchar,
       "description" text
);

CREATE TABLE "documents_projects" (
       "documents_id" varchar REFERENCES documents (id),
       "projects_id" bigint REFERENCES projects (id),
       "name" varchar,
       PRIMARY KEY ("documents_id", "projects_id")
);
CREATE INDEX ON "documents_projects" ("projects_id");

CREATE TABLE "users_projects" (
       "users_id" varchar REFERENCES users (id),
       "is_owner" bool DEFAULT TRUE,
       "projects_id" bigint REFERENCES projects (id),
       PRIMARY KEY ("users_id", "projects_id")
);
CREATE INDEX ON "users_projects" ("users_id");
