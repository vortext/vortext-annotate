CREATE TABLE "projects_predictors" (
       "projects_id" bigint REFERENCES projects (id),
       "uri" varchar NOT NULL,
       PRIMARY KEY ("projects_id", "uri"),
       UNIQUE ("projects_id", "uri")
);
CREATE INDEX ON "projects_predictors" ("projects_id");

CREATE TABLE "projects_categories" (
       "projects_id" bigint REFERENCES projects (id),
       "title" varchar,
       PRIMARY KEY ("projects_id", "title"),
       UNIQUE ("projects_id", "title")
);
CREATE INDEX ON "projects_categories" ("projects_id");
