-- name: get-document
-- Gets the document associated with a specific fingerprint
SELECT documents.* FROM documents
WHERE id = :document
LIMIT 1

-- name: exists-document?
-- Returns true if the document with id already exists
SELECT EXISTS(
SELECT 1 FROM documents
WHERE documents.id = :id
LIMIT 1
)

-- name: get-for-project
-- Returns the data associated with the document for the project
SELECT documents_projects.*
FROM documents_projects
WHERE documents_projects.projects_id = :project
AND documents_projects.documents_id = :document

-- name: insert-document!
-- Inserts a document file (as path) with a specified id
INSERT INTO documents (id, file) VALUES (:id, lo_import(:file))

-- name: documents-by-project
-- Get all the documents associated with a specific project_id
SELECT documents.id AS fingerprint, documents_projects.name
FROM documents, documents_projects
WHERE documents_projects.projects_id = :project
AND documents_projects.documents_id = documents.id

-- name: has-document?
-- Returns true if the document_id belongs to the project_id, false otherwise
SELECT EXISTS(
SELECT 1 FROM documents_projects
WHERE documents_id = :document
AND projects_id = :project
LIMIT 1)

-- name: assoc-document!
-- Associates a document_id with a specific project_id
INSERT INTO documents_projects (documents_id, projects_id, name)
VALUES (:document, :project, :name)

-- name: dissoc-document!
-- Disscociates document_id with a project_id
DELETE FROM documents_projects
WHERE documents_id = :document
AND projects_id = :project
