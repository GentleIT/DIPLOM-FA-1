#!/bin/sh
mkdir -p /data/db /data/uploads
rm -rf data public/uploads
ln -s /data/db data
ln -s /data/uploads public/uploads

if [ ! -f /data/db/.seeded ]; then
  node scripts/seed.js && touch /data/db/.seeded
fi

exec node server/index.js