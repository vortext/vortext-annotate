-- name: create-project<!
-- Creates a new project associated with a user
WITH projects_id AS (INSERT INTO projects ("title", "description") VALUES (:title, :description) RETURNING id)
INSERT INTO users_projects ("users_id", "projects_id") (SELECT :user_id, id FROM projects_id)

-- name: edit-project!
-- Edits the project title and description
UPDATE projects
SET
  title = :title,
  description = :description,
  last_updated = current_timestamp
WHERE id = :id

-- name: delete-project!
-- Delete to project with the id
DELETE FROM projects WHERE id = :id

-- name: get-project
-- Gets the project by id
SELECT id, title FROM projects WHERE id = :id LIMIT 1

-- name: has-project?
-- Returns true if the project_id belongs to the user_id, false otherwise
SELECT EXISTS(SELECT 1 FROM users_projects WHERE users_id = :user_id AND projects_id = :project_id)

-- name: project-exists?
-- Returns true if the project exists, false otherwise
SELECT EXISTS(SELECT 1 FROM projects AND id = :project_id)

-- name: select-projects-by-user
-- Returns the projects that are owned by the user with user_id
SELECT projects.* FROM projects, users_projects WHERE users_projects.users_id = :user_id AND projects.id = users_projects.projects_id

-- name: get-categories
-- Gets the extraction categories by project_id
SELECT entity_type, title FROM projects_categories WHERE projects_id = :project_id

-- name: insert-category!
-- Adds a category to the project
INSERT INTO projects_categories (projects_id, title) VALUES (:project_id, :title)

-- name: delete-categories!
-- Deletes all the categories associated with a project
DELETE FROM projects_categories WHERE projects_id = :project_id
