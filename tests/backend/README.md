# Website ↔ mobile acceptance tests

These run the app's own API client (`src/api/*`) against a real Shashtna
website and database, and click through the real admin console in Chromium.
Nothing is sent to Expo: the website is pointed at a local push recorder.

```bash
# 1. Website (in the Shashtna-Website-2.0 checkout), against a TEST database
npm run build
EXPO_PUSH_API_URL=http://127.0.0.1:4455 npm start          # port 3000

# 2. An OWNER account on that website (see its LOCAL_SETUP.md)

# 3. Here
SHASHTNA_API_URL=http://127.0.0.1:3000 \
ADMIN_PHONE=07XXXXXXXXX ADMIN_PASSWORD=... \
PUSH_RECORDER_PORT=4455 \
npm run test:backend
```

The tests create their own customer, orders, announcements and
notifications. Never run them against production.
