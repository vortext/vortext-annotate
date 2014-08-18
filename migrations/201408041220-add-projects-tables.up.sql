CREATE TABLE "documents" (
       "id" varchar PRIMARY KEY,
       "file" bytea,
       "meta" json,
       "last_updated" timestamp DEFAULT current_timestamp
);
COMMENT ON COLUMN "documents".id IS 'fingerprint produced by PDF.js';

CREATE TABLE "projects" (
       "id" bigserial PRIMARY KEY,
       "title" varchar,
       "description" text,
       "last_updated" timestamp DEFAULT current_timestamp
);

CREATE TABLE "users_projects" (
       "users_id" varchar REFERENCES users (id),
       "projects_id" bigint REFERENCES projects (id),
       PRIMARY KEY ("users_id", "projects_id")
);
CREATE INDEX ON "users_projects" ("users_id");

CREATE TABLE "documents_projects" (
       "documents_id" varchar REFERENCES documents (id),
       "projects_id" bigint REFERENCES projects (id),
       PRIMARY KEY ("documents_id", "projects_id")
);

CREATE TABLE "marginalia" (
       "documents_id" varchar REFERENCES documents (id),
       "projects_id" bigint REFERENCES projects (id),
       "marginalia" json,
       PRIMARY KEY ("documents_id", "projects_id")
);
