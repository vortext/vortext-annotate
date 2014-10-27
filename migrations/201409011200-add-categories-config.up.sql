CREATE TABLE "projects_categories" (
       "projects_id" bigint REFERENCES projects (id),
       "title" varchar NOT NULL,
       "entity_type" varchar,
       PRIMARY KEY ("projects_id", "title")
);
CREATE INDEX ON "projects_categories" ("projects_id");
