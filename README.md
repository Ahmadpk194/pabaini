# Pabaini

A community mobile app for Pabaini village (Swabi, KPK, Pakistan), built to keep local residents and the diaspora connected. It combines a village notice board, a sports hub with live cricket scoring, and phone-based authentication in one app.

> **Status:** In active development. Core features work; tournaments and some modules are still in progress.

---

## Why this exists

Village news, match schedules, and community updates mostly travel through scattered WhatsApp groups. Residents abroad (especially in the UAE) miss out, and information gets buried. Pabaini gives the community one place for announcements, sports, and live match updates, with a design that puts village identity first rather than a single feature.

The long-term idea is a model that can be reused for other villages.

---

## Features

### Village Notice Board
- Categorized announcements: **general**, **urgent**, and **event**
- Posted by admins and moderators
- Comments with soft delete, so threads stay intact
- Near real-time updates through interval-based polling
- Scoped search with category pills (All, Players, Teams, Posts, Matches, Users)

### Sports Hub
- Users register as players
- Create or join teams; captains manage squads
- Captaincy rule: a captain can hold at most 2 active teams (enforced in the service layer)
- Match requests and scheduling
- Flexible lineups of 6 to 11 players, reflecting how village cricket is actually played
- Team discovery screen
- Tournament support (in progress)

### Live Cricket Scoring
- Ball-by-ball scoring console for scorers, designed to fit a single viewport
- Live spectator view with scores and stats, updated through polling
- Expandable scorecard with Batting, Bowling, and Wickets tabs
- Idempotency keys on ball entry, so network failures never record a ball twice
- Simple result entry for matches that are not scored ball by ball
- Batsman retirement handling (retired hurt vs. retired out) and bowler mid-over replacement (in progress)
- Shareable match highlight card

### Authentication and Notifications
- Firebase Authentication with phone number + OTP, and Google sign-in
- Guest mode with read-only access
- Push notifications through Firebase Cloud Messaging (FCM)

### Planned
- Blood donor registry
- Full tournament management
- Reply threads on comments (schema already supports it)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native (Expo), Expo Router, TypeScript |
| State and data | Zustand, TanStack Query, Axios |
| Backend | NestJS, TypeORM |
| Database | PostgreSQL (hosted on Supabase) |
| Auth | Firebase Auth (`@react-native-firebase`) |
| Notifications | Firebase Cloud Messaging |
| Builds | Expo local builds, EAS Build for distributable APKs |

---

## Architecture

```
┌──────────────────────┐        REST         ┌──────────────────────┐
│  React Native (Expo) │  ───────────────▶  │   NestJS API         │
│  Zustand + TanStack  │  ◀───────────────  │   Modules + Guards   │
│  Query (polling)     │       JSON          │   TypeORM            │
└─────────┬────────────┘                     └─────────┬────────────┘
          │                                            │
          │ Phone OTP / Google                         │ SQL
          ▼                                            ▼
┌──────────────────────┐                     ┌──────────────────────┐
│  Firebase Auth / FCM │                     │  PostgreSQL          │
└──────────────────────┘                     │  (Supabase)          │
                                             └──────────────────────┘
```

**Design decisions worth noting**

- **Polling over WebSockets for live data.** Interval-based polling through TanStack Query keeps the stack simple and works well at village scale. Updates are near real-time, not instant.
- **Idempotent scoring.** Every ball entry carries an idempotency key, which matters on unreliable mobile networks.
- **Business rules in the service layer.** Rules like the captain team limit live in services, not in controllers or the client.
- **Single comments table.** A self-referential table with a nullable `parent_id` and polymorphic entity references, so comments can be reused across features and replies added later.
- **Soft delete for comments.** Deleting a comment never breaks a thread.
- **Config-driven UI.** Search categories and share options are driven by config arrays, so adding a new type is one array entry plus one component.
- **Flexible domain rules.** Lineups accept 6 to 11 players because real village matches rarely have exactly 11.

---

## Screenshots

<!-- Add screenshots here. Suggested: login, notice board, scorer console, live match viewer, team screen. -->

| Notice Board | Scorer Console | Live Match |
|---|---|---|
| ![Notice board](docs/screenshots/notice-board.png) | ![Scorer](docs/screenshots/scorer.png) | ![Live match](docs/screenshots/live-match.png) |

---

## Getting Started

### Prerequisites

- Node.js 20+
- A PostgreSQL database (Supabase or local)
- A Firebase project with Phone Authentication and Cloud Messaging enabled
- Android Studio (for Android builds) and the Expo tooling

### 1. Clone

```bash
git clone https://github.com/Ahmadpk194/pabaini.git
cd pabaini
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Fill in `.env`:

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="your-private-key"
PORT=3000
```

Run it:

```bash
npm run start:dev
```

### 3. Mobile app

```bash
cd mobile
npm install
cp .env.example .env
```

Set the API base URL in `.env`, then add your own `google-services.json` (Android) from your Firebase project. This app uses native Firebase modules, so it needs a development build rather than Expo Go:

```bash
npx expo run:android
```

### 4. Distributable APK (for testers)

```bash
eas build --profile preview --platform android
```

> Folder names and env variable names above are placeholders. Adjust them to match the repo layout.

---

## Roadmap

- [x] Notice board with categories and comments
- [x] Phone OTP and Google authentication, guest mode
- [x] Team creation, joining, and captain management
- [x] Match requests, lineup declaration, simple result entry
- [x] Ball-by-ball live scoring and spectator view
- [x] Push notifications (FCM)
- [ ] Batsman retirement and bowler replacement edge cases
- [ ] Tournament management
- [ ] Blood donor registry
- [ ] Comment replies
- [ ] Offline scoring improvements

---

## Testing

The app is tested with real users: local cricket players use the scorer console and spectator view during actual matches, and that feedback drives the next stage of work. Features ship in numbered stages (backend first, then mobile) so each piece can be tested on its own.

---

## Author

**Ahmad Khan**, software engineer (Node.js, NestJS, TypeScript, React Native).

- GitHub: [github.com/Ahmadpk194](https://github.com/Ahmadpk194)
- LinkedIn: [linkedin.com/in/ahmad-khan-974203a8](https://www.linkedin.com/in/ahmad-khan-974203a8/)

---

## License

Add a license before making the repo public (MIT is a common choice).
