/* @name findUserByEmail */
SELECT /* findUserById の型と合わせること */
  u.id,
  u.role,
  u.usage_status AS "usageStatus",
  u.display_name AS "displayName",
  u.given_name   AS "givenName",
  u.family_name  AS "familyName",
  u.middle_name  AS "middleName",
  u.email,
  u.photo_url    AS "photoUrl"
FROM mst_users u
WHERE 
  u.email = :email
  AND u.valid_to = 'infinity'::timestamp
;