-- name: get-document
-- Gets the document associated with a specific fingerprint
SELECT documents.* FROM documents
WHERE id = :document
LIMIT 1

-- name: get-document-with-marginalia
-- Gets the document with marginalia associated with a specific fingerprint
SELECT documents.*, marginalia.marginalia FROM documents, marginalia
WHERE documents.id = :document
AND marginalia.documents_id = :document
AND marginalia.projects_id = :project
LIMIT 1

-- name: create-document<!
-- Creates a document associated with a specific project, no-op if already present
WITH documents_id AS (
     INSERT INTO documents ("id", "file", "name") SELECT :document, :file, :name
     WHERE NOT EXISTS (SELECT id FROM documents WHERE id = :document))
INSERT INTO documents_projects (documents_id, projects_id) SELECT :document, :project
WHERE NOT EXISTS (SELECT 1 FROM documents_projects WHERE documents_id = :document AND projects_id = :project)

-- name: documents-by-project
-- Get all the documents associated with a specific project_id
SELECT documents.id AS fingerprint, documents.name, documents.last_updated
FROM documents, documents_projects
WHERE documents_projects.projects_id = :project
AND documents_projects.documents_id = documents.id

-- name: documents-by-project-with-marginalia
-- Get all the documents with marginalia associated with a specific project_id
SELECT documents.id AS fingerprint, documents.name, documents.file, marginalia.marginalia
FROM documents, documents_projects, marginalia
WHERE documents_projects.projects_id = :project
AND documents_projects.documents_id = documents.id
AND marginalia.documents_id = documents.id AND marginalia.projects_id = :project

-- name: has-document?
-- Returns true if the document_id belongs to the project_id, false otherwise
SELECT EXISTS(
SELECT 1 FROM documents_projects
WHERE documents_id = :document
AND projects_id = :project)

-- name: assoc-document!
-- Associates a document_id with a specific project_id, errors if already present
INSERT INTO documents_projects (documents_id, projects_id)
VALUES (:document, :project)

-- name: dissoc-document!
-- Disscociates document_id with a project_id
DELETE FROM documents_projects
WHERE documents_id = :document
AND projects_id = :project

-- name: create-marginalia!
-- Creates marginalia specified with a specific project and fingerprint
INSERT INTO marginalia (documents_id, projects_id, marginalia)
VALUES (:document, :project, CAST(:marginalia AS json))

-- name: get-marginalia
-- Returns the marginalia associated with a specific document and project
SELECT marginalia FROM marginalia
WHERE documents_id = :document AND projects_id = :project
LIMIT 1

-- name: update-marginalia!
-- Updates the marginalia associated with a document_id
UPDATE marginalia SET marginalia = CAST(:marginalia AS json)
WHERE documents_id = :document AND projects_id = :project

-- name: delete-marginalia!
-- Deletes the marginalia associated with a specific document_id
DELETE FROM marginalia
WHERE documents_id = :document
AND projects_id = :project
