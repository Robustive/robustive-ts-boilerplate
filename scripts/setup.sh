#!/bin/sh

ENV_LOCAL="packages/backend/.env.local"

if [ -e $ENV_LOCAL ]; then
    echo "[OK] ${ENV_LOCAL} exists."
    exit 1
fi

echo "${ENV_LOCAL} does not exist. creating .env.local..."

touch $ENV_LOCAL

echo "GOOGLE_OAUTH_20_CLIENT_ID=" >> $ENV_LOCAL
echo "GOOGLE_OAUTH_20_CLIENT_SECRET=" >> $ENV_LOCAL
echo "SESSION_SECRET=MY_SECRET" >> $ENV_LOCAL
