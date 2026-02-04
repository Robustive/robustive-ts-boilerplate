CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE SCHEMA main;
ALTER SCHEMA main OWNER TO inspectoruser;

ALTER DATABASE inspectordb SET SEARCH_PATH TO main;
ALTER USER inspectoruser SET SEARCH_PATH TO main;

DROP TABLE IF EXISTS mst_labels;
CREATE TABLE mst_labels (
  name                  VARCHAR(255)  NOT NULL,
  value                 INTEGER       NOT NULL,
  kind                  VARCHAR(255)  NOT NULL,
  description           VARCHAR(255),
  updated_at            TIMESTAMP,
  created_at            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT mst_labels_pk PRIMARY KEY (name, value)
);

DROP TABLE IF EXISTS mst_users;
CREATE TABLE mst_users (
  id                  UUID          NOT NULL,
  valid_from          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  valid_to            TIMESTAMP     NOT NULL DEFAULT 'infinity'::TIMESTAMP,
  role                VARCHAR(255)  NOT NULL,
  usage_status        INTEGER       NOT NULL DEFAULT 0,
  display_name        VARCHAR(255)  NOT NULL,
  given_name          VARCHAR(255),
  family_name         VARCHAR(255),
  middle_name         VARCHAR(255),
  email               CITEXT        NOT NULL,
  photo_url           VARCHAR(255),
  updated_at          TIMESTAMP,
  created_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT mst_users_pk PRIMARY KEY (id, valid_from),
  CONSTRAINT mst_users_valid_range_chk CHECK (valid_from < valid_to),
  CONSTRAINT mst_users_no_overlap
    EXCLUDE USING gist (
      id WITH =,
      tsrange(valid_from, valid_to, '[)') WITH &&
    )
);

CREATE INDEX mst_users_current_idx
  ON mst_users (id)
  WHERE valid_to = 'infinity'::timestamp;

CREATE UNIQUE INDEX mst_users_email_current_uq
  ON mst_users (email)
  WHERE valid_to = 'infinity'::timestamp;

ALTER TABLE mst_users OWNER TO inspectoruser;

INSERT INTO mst_labels (name, value, kind, description)
VALUES
    ('usage_status', 0, 'created', '初期状態。アカウント必須項目の確認（activate）が必要'),
    ('usage_status', 1, 'activated', 'アカウント必須項目の確認（activate）が完了している')
;

DROP TABLE IF EXISTS mst_users_google_openid;
CREATE TABLE mst_users_google_openid (
  sub                 VARCHAR(255)  NOT NULL,
  id                  UUID          NOT NULL,
  valid_from          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  valid_to            TIMESTAMP     NOT NULL DEFAULT 'infinity'::TIMESTAMP,
  updated_at          TIMESTAMP,
  created_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT mst_users_google_openid_pk PRIMARY KEY (sub),
  CONSTRAINT mst_users_google_openid_valid_range_chk CHECK (valid_from < valid_to)
);

CREATE INDEX mst_users_google_openid_current_idx
  ON mst_users_google_openid (sub)
  WHERE valid_to = 'infinity'::timestamp;

CREATE INDEX idx_mst_users_google_openid_id ON mst_users_google_openid (id);

ALTER TABLE mst_users_google_openid OWNER TO inspectoruser;

-- DROP TABLE IF EXISTS trn_task;
-- CREATE TABLE trn_task (
--   id                VARCHAR(18)     PRIMARY KEY,
--   typeStatus        VARCHAR(5)      NOT NULL,
--   title             VARCHAR(255)    NOT NULL,
--   purpose           VARCHAR(255),
--   goal              VARCHAR(255),
--   instractions      TEXT,
--   author            VARCHAR(255),
--   owner             VARCHAR(255)[],
--   assignees         VARCHAR(255)[],
--   members           VARCHAR(255)[],
--   involved          VARCHAR(255)[],
--   ancestorIds       VARCHAR(255)[],
--   children          VARCHAR(255)[],
--   startedAt         TIMESTAMP,
--   deadline          TIMESTAMP,
--   lastTimeWorkedAt  TIMESTAMP,
--   updatedAt         TIMESTAMP,
--   createdAt         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
-- );

-- ALTER TABLE trn_task OWNER TO inspectoruser;


INSERT INTO mst_labels (name, value, kind, description)
VALUES
    ('activity_type', 1, 'create', 'アカウント作成'),
    ('activity_type', 2, 'signIn', 'サインイン')
;