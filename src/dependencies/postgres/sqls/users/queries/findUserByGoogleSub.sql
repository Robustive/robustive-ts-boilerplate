/* @name findUserByGoogleSub */
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
FROM mst_users_google_openid g
  INNER JOIN mst_users u
    ON  g.id = u.id
    AND g.sub = :sub
    AND g.valid_to = 'infinity'::timestamp
    AND u.valid_to = 'infinity'::timestamp
;