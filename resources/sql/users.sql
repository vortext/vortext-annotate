-- name: create-user!
-- Inserts a new user with an id and pass
INSERT INTO users ("id", "pass") VALUES (:id, :pass)

-- name: get-user
-- Retrieves a single user by its id
SELECT * FROM users WHERE id = :id LIMIT 1

-- name: update-user!
-- Updates the users' personal details
UPDATE users
SET
  first_name = :first_name,
  last_name = :last_name,
  email = :email
WHERE id = :id
