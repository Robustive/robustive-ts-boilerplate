/* @name createUserFromGoogleOpenId */
WITH insert_user AS (
  INSERT INTO mst_users (id, role, display_name, given_name, family_name, middle_name, email, photo_url)
  VALUES (:id, :role, :displayName, :givenName, :familyName, :middleName, :email, :photoUrl)
)
INSERT INTO mst_users_google_openid (sub, id)
VALUES (:sub, :id)
;