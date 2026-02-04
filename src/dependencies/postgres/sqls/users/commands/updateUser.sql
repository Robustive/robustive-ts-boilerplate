/* @name updateUser */
UPDATE mst_users
SET
  display_name = :displayName!
WHERE
  id = :id!;
