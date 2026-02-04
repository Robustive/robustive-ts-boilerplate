/* @name createUserGoogleOpenId */
INSERT INTO mst_users_google_openid (
  sub,
  id
) VALUES (
  :sub,
  :id
);