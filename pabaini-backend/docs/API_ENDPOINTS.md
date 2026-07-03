# Pabaini Backend — API Reference

> **Pabaini** is a community mobile app for Pabaini village (Swabi District, KPK, Pakistan). This document is the complete developer reference for all NestJS backend REST API endpoints, organized by module and phase.

---

## Quick Reference

| Module | Endpoints | Status |
|---|---|---|
| Authentication | 1 | ✅ Live |
| Users | 8 | ✅ Live |
| Announcements | 13 | ✅ Live |
| Sports — Phase 1 (Cricket Profiles) | 5 | ✅ Live |
| Sports — Phase 2 (Cricket Teams) | 14 | ✅ Live |
| Notifications Module | 4 | ✅ Live |
| Sports — Phase 3 (Matches & Lineups) | 9 | ✅ Live |
| Sports — Phase 3 (Simple Scoring Mode) | 2 | ✅ Live |
| Sports — Phase 3 (Live Scoring) | 6 | ✅ Live |
| Sports — Phase 3 (Leaderboard & Standings) | 2 | 🗓 Roadmap |
| **Total** | **64** | |

---

## Base Configuration

| Setting | Value |
|---|---|
| Base URL (Local) | `http://localhost:3000` |
| Base URL (Android Emulator) | `http://10.0.2.2:3000` |
| Global API Prefix | `/api/v1` |

**Standard Response Envelope** — every response follows this shape:

```typescript
interface ApiResponse<T> {
  success: boolean;   // true on success
  status: number;     // mirrors HTTP status code
  message?: string;   // human-readable outcome
  data: T;            // payload
}
```

---

## Table of Contents

### 1. Authentication Module
- [#1 — POST `/auth/login`](#1-post-authlogin) — Firebase sign-in / register

### 2. Users Module
- [#2 — GET `/users/me`](#2-get-usersme) — Get my profile
- [#3 — PATCH `/users/me`](#3-patch-usersme) — Update my profile
- [#4 — POST `/users/me/avatar`](#4-post-usersmeavatar) — Upload avatar
- [#5 — PATCH `/users/:id/role`](#5-patch-usersidrole) — Update user role *(Admin only)*
- [#6 — POST `/users/device-token`](#6-post-usersdevice-token) — Register FCM token
- [#7 — DELETE `/users/device-token`](#7-delete-usersdevice-token) — Remove FCM token
- [#46 — GET `/users/:id/profile`](#46-get-usersidprofile) — Public aggregated user profile
- [#64 — GET `/users`](#64-get-users) — User directory (protected)

### 3. Announcements Module
- [#8 — GET `/announcements`](#8-get-announcements) — Get all announcements
- [#9 — GET `/announcements/author/:authorId`](#9-get-announcementsauthorauthorid) — By author
- [#10 — GET `/announcements/:id`](#10-get-announcementsid) — Single announcement
- [#11 — POST `/announcements`](#11-post-announcements) — Create *(Admin/Mod or Team Captain for match results)*
- [#12 — PATCH `/announcements/:id`](#12-patch-announcementsid) — Update *(Author/Admin/Mod)*
- [#13 — PATCH `/announcements/:id/soft-delete`](#13-patch-announcementsidsoft-delete) — Soft-delete *(Author/Admin)*
- [#14 — DELETE `/announcements/:id`](#14-delete-announcementsid) — Hard-delete *(Admin only)*
- [#15 — POST `/announcements/:id/like`](#15-post-announcementsidlike) — Toggle like
- [#16 — POST `/announcements/:id/image`](#16-post-announcementsidimage) — Upload image
- [#60 — GET `/announcements/:announcementId/comments`](#60-get-announcementsannouncementidcomments) — Get comments
- [#61 — POST `/announcements/:announcementId/comments`](#61-post-announcementsannouncementidcomments) — Create comment
- [#62 — PATCH `/announcements/:announcementId/comments/:commentId`](#62-patch-announcementsannouncementidcommentscommentid) — Edit comment
- [#63 — DELETE `/announcements/:announcementId/comments/:commentId`](#63-delete-announcementsannouncementidcommentscommentid) — Delete comment (Soft-delete)

### 4. Sports Module — Phase 1 ✅ Implemented
- [#17 — POST `/sports/cricket/players/me`](#17-post-sportscricketplayersme) — Create profile
- [#18 — GET `/sports/cricket/players/me`](#18-get-sportscricketplayersme) — Get my profile
- [#19 — PATCH `/sports/cricket/players/me`](#19-patch-sportscricketplayersme) — Update profile
- [#20 — GET `/sports/cricket/players/:id`](#20-get-sportscricketplayersid) — Public player profile
- [#21 — GET `/sports/cricket/players`](#21-get-sportscricketplayers) — List all players

### 5. Sports Module — Phase 2 ✅ Implemented
- [#22 — POST `/sports/cricket/teams`](#22-post-sportscricketteams) — Create team
- [#23 — GET `/sports/cricket/teams`](#23-get-sportscricketteams) — List all teams
- [#24 — GET `/sports/cricket/teams/my`](#24-get-sportscricketteamsmy) — My teams
- [#25 — GET `/sports/cricket/teams/:id`](#25-get-sportscricketteamsid) — Get team with full squad
- [#26 — PATCH `/sports/cricket/teams/:id`](#26-patch-sportscricketteamsid) — Update team details
- [#27 — POST `/sports/cricket/teams/:id/logo`](#27-post-sportscricketteamsidlogo) — Upload team logo
- [#28 — POST `/sports/cricket/teams/:id/invite`](#28-post-sportscricketteamsidinvite) — Invite a player
- [#29 — POST `/sports/cricket/teams/:id/request`](#29-post-sportscricketteamsidrequest) — Request to join
- [#30 — GET `/sports/cricket/teams/:id/members/pending`](#30-get-sportscricketteamsidmemberspending) — View pending invites/requests
- [#31 — PATCH `/sports/cricket/teams/:id/members/:memberId/accept`](#31-patch-sportscricketteamsidmembersmemberidaccept) — Accept invite or request
- [#32 — PATCH `/sports/cricket/teams/:id/members/:memberId/reject`](#32-patch-sportscricketteamsidmembersmemberidreject) — Reject invite or request
- [#33 — DELETE `/sports/cricket/teams/:id/members/:memberId`](#33-delete-sportscricketteamsidmembersmemberid) — Remove player or leave team
- [#34 — PATCH `/sports/cricket/teams/:id/captain`](#34-patch-sportscricketteamsidcaptain) — Transfer captaincy
- [#35 — DELETE `/sports/cricket/teams/:id`](#35-delete-sportscricketteamsid) — Soft-delete team

### 6. Notifications Module ✅ Implemented
- [#36 — GET `/notifications`](#36-get-notifications) — Get notifications
- [#37 — GET `/notifications/unread-count`](#37-get-notificationsunread-count) — Get unread count
- [#38 — PATCH `/notifications/read-all`](#38-patch-notificationsread-all) — Mark all read
- [#39 — PATCH `/notifications/:id/read`](#39-patch-notificationsidread) — Mark specific read

### 7. Sports Module — Phase 3 (Matches & Lineups) ✅ Implemented
- [#40 — POST `/sports/cricket/matches/request`](#40-post-sportscricketmatchesrequest) — Challenge opponent team
- [#41 — GET `/sports/cricket/matches`](#41-get-sportscricketmatches) — List matches
- [#42 — GET `/sports/cricket/matches/:id`](#42-get-sportscricketmatchesid) — Get match details
- [#43 — PATCH `/sports/cricket/matches/:id/accept`](#43-patch-sportscricketmatchesidaccept) — Accept match request
- [#44 — PATCH `/sports/cricket/matches/:id/decline`](#44-patch-sportscricketmatchesiddecline) — Decline match request
- [#45 — PATCH `/sports/cricket/matches/:id`](#45-patch-sportscricketmatchesid) — Edit match details
- [#47 — PATCH `/sports/cricket/matches/:id/cancel`](#47-patch-sportscricketmatchesidcancel) — Cancel match request
- [#48 — POST `/sports/cricket/matches/:id/lineup`](#48-post-sportscricketmatchesidlineup) — Declare Playing XI lineup
- [#49 — GET `/sports/cricket/matches/:id/lineup`](#49-get-sportscricketmatchesidlineup) — View declared lineups

### 8. Sports Module — Phase 3 (Simple Scoring Mode) ✅ Implemented
- [#50 — POST `/sports/cricket/matches/:id/result`](#50-post-sportscricketmatchesidresult) — Submit scorecard & result
- [#51 — PATCH `/sports/cricket/matches/:id/result`](#51-patch-sportscricketmatchesidresult) — Edit scorecard & result (within 24 hours)

### 9. Sports Module — Phase 3 (Live Scoring) ✅ Implemented
- [#52 — PATCH `/sports/cricket/matches/:id/start`](#52-patch-sportscricketmatchesidstart) — Start match live scoring
- [#53 — POST `/sports/cricket/matches/:id/balls`](#53-post-sportscricketmatchesidballs) — Record a single ball event
- [#54 — PATCH `/sports/cricket/matches/:id/bowler`](#54-patch-sportscricketmatchesidbowler) — Select bowler for new over
- [#55 — PATCH `/sports/cricket/matches/:id/innings/start`](#55-patch-sportscricketmatchesidinningsstart) — Start second innings
- [#56 — PATCH `/sports/cricket/matches/:id/balls/undo`](#56-patch-sportscricketmatchesidballsundo) — Undo last ball
- [#56b — PATCH `/sports/cricket/matches/:id/strike/rotate`](#56b-patch-sportscricketmatchesidstrikerotate) — Rotate strike manually
- [#57 — GET `/sports/cricket/matches/:id/live`](#57-get-sportscricketmatchesidlive) — Public live scoring view

### 10. Sports Module — Phase 3 (Leaderboard & Standings) 🗓 Roadmap
- [#58 — GET `/sports/cricket/leaderboard`](#58-get-sportscricketleaderboard) — Leaderboard standings
- [#59 — GET `/sports/cricket/stats/mvp`](#59-get-sportscricketstatsmvp) — MVP rankings

---

## 1. Authentication Module

### #1 · POST `/auth/login`

Validates a Firebase ID token and signs the user in. On first sign-in, automatically creates a PostgreSQL user record.

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/v1/auth/login` |
| **Access** | 🟢 Public |

**Headers**

```
Content-Type: application/json
```

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `id_token` | `string` | ✅ Yes | Firebase ID token from client-side sign-in |

**cURL Example**

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"id_token": "YOUR_FIREBASE_ID_TOKEN"}'
```

**Response `201 Created`**

```json
{
  "success": true,
  "status": 201,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "firebase_uid": "C0Np3cHX2ugOWNzenBka4O8zokt1",
      "phone": "+923001234567",
      "email": "resident@gmail.com",
      "name": "Ahmad Pabaini",
      "avatar_url": "https://supabase-bucket/avatars/avatar.jpg",
      "village": "Pabaini",
      "is_diaspora": false,
      "role": "resident",
      "created_at": "2026-06-12T01:10:00.000Z",
      "updated_at": "2026-06-12T01:10:00.000Z"
    }
  }
}
```

---

## 2. Users Module

### #2 · GET `/users/me`

Fetch the authenticated user's full profile including role and settings.

| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/v1/users/me` |
| **Access** | 🔴 Protected |

**Headers**

```
Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>
```

**cURL Example**

```bash
curl -X GET http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

**Response `200 OK`**

```json
{
  "success": true,
  "status": 200,
  "data": {
    "id": 1,
    "firebase_uid": "C0Np3cHX2ugOWNzenBka4O8zokt1",
    "phone": "+923001234567",
    "email": "resident@gmail.com",
    "name": "Ahmad Pabaini",
    "avatar_url": "https://supabase-bucket/avatars/avatar.jpg",
    "village": "Pabaini",
    "is_diaspora": false,
    "role": "resident",
    "created_at": "2026-06-12T01:10:00.000Z",
    "updated_at": "2026-06-12T01:10:00.000Z"
  }
}
```

---

### #3 · PATCH `/users/me`

Updates editable fields on the user's profile record.

| | |
|---|---|
| **Method** | `PATCH` |
| **Path** | `/api/v1/users/me` |
| **Access** | 🔴 Protected |

**Headers**

```
Content-Type: application/json
Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>
```

**Request Body** *(all fields optional)*

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Display name (3–50 characters) |
| `village` | `string` | Location label (defaults to `"Pabaini"`) |
| `is_diaspora` | `boolean` | `true` if member lives abroad |
| `avatar_url` | `string` | Direct URL to avatar image |

**cURL Example**

```bash
curl -X PATCH http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Ahmad Swabi", "is_diaspora": true}'
```

**Response `200 OK`**

```json
{
  "success": true,
  "status": 200,
  "message": "Profile updated successfully",
  "data": {
    "id": 1,
    "name": "Ahmad Swabi",
    "is_diaspora": true,
    "village": "Pabaini",
    "role": "resident"
  }
}
```

---

### #4 · POST `/users/me/avatar`

Uploads an image to Supabase Storage and saves the returned URL to the user's profile.

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/v1/users/me/avatar` |
| **Access** | 🔴 Protected |

**Headers**

```
Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>
```

**Request Body** *(multipart/form-data)*

| Field | Type | Required | Description |
|---|---|---|---|
| `avatar` | `file` | ✅ Yes | Image file — JPG, PNG, or JPEG |

**cURL Example**

```bash
curl -X POST http://localhost:3000/api/v1/users/me/avatar \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -F "avatar=@/path/to/profile.png"
```

---

### #5 · PATCH `/users/:id/role`

Elevates or changes a user's platform role. Restricted exclusively to Admins.

| | |
|---|---|
| **Method** | `PATCH` |
| **Path** | `/api/v1/users/:id/role` |
| **Access** | 🟡 Admin Only |

> [!WARNING]
> Only accounts with the `admin` role can call this endpoint. Moderators are blocked.

**Headers**

```
Content-Type: application/json
Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>
```

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `role` | `string` | ✅ Yes | Target role: `resident` · `moderator` · `admin` |

**cURL Example**

```bash
curl -X PATCH http://localhost:3000/api/v1/users/2/role \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "moderator"}'
```

---

### #6 · POST `/users/device-token`

Registers an FCM push token for the authenticated device to enable targeted notifications.

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/v1/users/device-token` |
| **Access** | 🔴 Protected |

**Headers**

```
Content-Type: application/json
Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>
```

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `token` | `string` | ✅ Yes | FCM device registration token |

**cURL Example**

```bash
curl -X POST http://localhost:3000/api/v1/users/device-token \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"token": "FCM_DEVICE_TOKEN_HERE"}'
```

---

### #7 · DELETE `/users/device-token`

Removes an FCM push token on sign-out to prevent stale push delivery.

| | |
|---|---|
| **Method** | `DELETE` |
| **Path** | `/api/v1/users/device-token` |
| **Access** | 🔴 Protected |

**Headers**

```
Content-Type: application/json
Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>
```

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `token` | `string` | ✅ Yes | FCM token to remove |

**cURL Example**

```bash
curl -X DELETE http://localhost:3000/api/v1/users/device-token \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"token": "FCM_DEVICE_TOKEN_HERE"}'
```

---

### #46 · GET `/users/:id/profile`

Retrieves a resident's public aggregated profile, including user details, active and past cricket team rosters, and player stats. Returns `cricket: null` for non-players.

| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/v1/users/:id/profile` |
| **Access** | 🟢 Public |

**Path Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | `number` | ✅ Yes | User ID to look up |

**cURL Example**

```bash
curl -X GET http://localhost:3000/api/v1/users/13/profile
```

**Response `200 OK` (User with Cricket Player Profile)**

```json
{
  "success": true,
  "status": 200,
  "data": {
    "user": {
      "id": 13,
      "name": "Messi khan",
      "avatar_url": "https://ntsscybmwyirhoidflqs.supabase.co/storage/v1/object/public/pabaini-media/avatars/QAw15jU7SSfQncmzZvkuUOTvcv22-1781522650987.jpeg",
      "village": "Pabaini",
      "is_diaspora": false,
      "created_at": "2026-06-15T05:34:44.325Z"
    },
    "cricket": {
      "player_profile": {
        "id": 1,
        "user_id": 13,
        "role": "batsman",
        "batting_hand": "right",
        "bowling_arm": "right",
        "bowling_type": "medium",
        "is_active": true,
        "created_at": "2026-06-15T14:53:38.199Z",
        "updated_at": "2026-06-15T15:00:43.707Z"
      },
      "stats": {
        "competitive": {
          "matches": 0,
          "innings": 0,
          "runs": 0,
          "highest_score": 0,
          "average": 0,
          "strike_rate": 0,
          "fours": 0,
          "sixes": 0,
          "wickets": 0,
          "best_bowling": null,
          "economy": 0
        },
        "casual": {
          "matches": 0,
          "innings": 0,
          "runs": 0,
          "highest_score": 0,
          "average": 0,
          "strike_rate": 0,
          "fours": 0,
          "sixes": 0,
          "wickets": 0,
          "best_bowling": null,
          "economy": 0
        }
      },
      "current_teams": [
        {
          "id": 2,
          "name": "Nataar eleven",
          "logo_url": null,
          "role": "captain"
        }
      ],
      "past_teams": [
        {
          "id": 1,
          "name": "Pabaini XI",
          "logo_url": null,
          "left_at": "2026-06-16T07:07:50.399Z"
        }
      ],
      "trophies": []
    }
  }
}
```

**Response `200 OK` (User without Cricket Profile)**

```json
{
  "success": true,
  "status": 200,
  "data": {
    "user": {
      "id": 17,
      "name": "Ahmad khan",
      "avatar_url": null,
      "village": null,
      "is_diaspora": false,
      "created_at": "2026-06-16T05:31:18.639Z"
    },
    "cricket": null
  }
}
```

---

### #64 · GET `/users`

Retrieves a paginated directory of registered users who have set up their names.

| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/v1/users` |
| **Access** | 🔴 Protected |

**Headers**

```
Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>
```

**Query Parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | `number` | `1` | Pagination offset |
| `limit` | `number` | `20` | Results per page |
| `search` | `string` | — | Plaintext search term matching display name |

**cURL Example**

```bash
curl -X GET "http://localhost:3000/api/v1/users?page=1&limit=20&search=Ahmad" \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

**Response `200 OK`**

```json
{
  "success": true,
  "status": 200,
  "message": "Users directory retrieved successfully",
  "data": {
    "data": [
      {
        "id": 13,
        "name": "Messi khan",
        "avatar_url": "https://supabase-bucket/avatars/QAw15jU7SSfQncmzZvkuUOTvcv22-1781522650987.jpeg",
        "created_at": "2026-06-15T05:34:44.325Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

## 3. Announcements Module

### #8 · GET `/announcements`

Returns a paginated, filtered feed of village announcements. Pinned notices appear first.

| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/v1/announcements` |
| **Access** | 🟢 Public *(auth token optional — binds `liked_by_me`)* |

**Query Parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | `number` | `1` | Pagination offset |
| `limit` | `number` | `10` | Results per page |
| `category` | `string` | — | Filter: `general` · `urgent` · `event` · `jirga_decision` · `match_result` |
| `search` | `string` | — | Plaintext search term matching title or content |

**cURL Example**

```bash
curl -X GET "http://localhost:3000/api/v1/announcements?page=1&limit=10&category=urgent&search=water"
```

**Response `200 OK`**

```json
{
  "success": true,
  "status": 200,
  "message": "Announcements retrieved successfully",
  "data": [
    {
      "id": 12,
      "title": "Jirga Announcement",
      "content": "Decisions on local water supply rules.",
      "category": "jirga_decision",
      "image_url": "https://...",
      "location": "Pabaini Hujra",
      "likes_count": 8,
      "liked_by_me": false,
      "is_pinned": true,
      "author_id": 1,
      "author": {
        "id": 1,
        "name": "Admin Leader",
        "avatar_url": "https://..."
      },
      "created_at": "2026-06-12T01:10:00.000Z",
      "updated_at": "2026-06-12T01:10:00.000Z"
    }
  ],
  "pagination": {
    "total": 12,
    "page": 1,
    "limit": 10,
    "totalPages": 2
  }
}
```

---

### #9 · GET `/announcements/author/:authorId`

Returns announcements created by a specific user.

| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/v1/announcements/author/:authorId` |
| **Access** | 🟢 Public |

---

### #10 · GET `/announcements/:id`

Fetch the full details of a single announcement by its database ID.

| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/v1/announcements/:id` |
| **Access** | 🟢 Public |

---

### #11 · POST `/announcements`

Creates a new announcement. Restricted to `admin` and `moderator` roles **or** team captains posting a `match_result` for their own match.

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/v1/announcements` |
| **Access** | 🔴 Protected *(Admin / Mod — or Team Captain for `match_result` category)* |

> [!NOTE]
> Standard residents cannot create announcements. Admins and Moderators may post any category.
> Team captains are granted the additional privilege to post a `match_result` announcement by supplying their `match_id`. The service validates that the calling user's cricket player profile is the captain of either `team_a` or `team_b` in the referenced match.

**Headers**

```
Content-Type: application/json
Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>
```

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | `string` | ✅ Yes | Notice title (3–100 characters) |
| `content` | `string` | ✅ Yes | Full description (10–500 characters) |
| `category` | `string` | ✅ Yes | `general` · `urgent` · `event` · `jirga_decision` · `match_result` |
| `location` | `string` | No | Optional landmark or place name |
| `image_url` | `string` | No | Direct URL to an uploaded image |
| `match_id` | `number` | No | Cricket match ID — required when `category` is `match_result`. Triggers captain validation. |

**cURL Example**

```bash
curl -X POST http://localhost:3000/api/v1/announcements \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Jirga Assembly", "content": "Community meeting at Hujra.", "category": "jirga_decision", "location": "Pabaini Hujra"}'
```

---

### #12 · PATCH `/announcements/:id`

Updates fields on an existing announcement. Ownership or elevated role required.

| | |
|---|---|
| **Method** | `PATCH` |
| **Path** | `/api/v1/announcements/:id` |
| **Access** | 🔴 Protected *(Author / Admin / Mod)* |

**Editable fields** *(all optional)*: `title`, `content`, `category`, `location`, `image_url`, `is_pinned`

---

### #13 · PATCH `/announcements/:id/soft-delete`

Flags an announcement as deleted (`is_deleted = true`) without removing it from storage.

| | |
|---|---|
| **Method** | `PATCH` |
| **Path** | `/api/v1/announcements/:id/soft-delete` |
| **Access** | 🔴 Protected *(Author / Admin)* |

> [!IMPORTANT]
> **Access rules:** Only the **Author** or a user with the **Admin** role can soft-delete. Moderators cannot delete other users' posts.
>
> **Image assets** are preserved in Supabase Storage to support audit recovery.

**Headers**

```
Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>
```

**cURL Example**

```bash
curl -X PATCH http://localhost:3000/api/v1/announcements/12/soft-delete \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

---

### #14 · DELETE `/announcements/:id`

Permanently deletes an announcement record and removes associated media from Supabase Storage.

| | |
|---|---|
| **Method** | `DELETE` |
| **Path** | `/api/v1/announcements/:id` |
| **Access** | 🟡 Admin Only |

> [!WARNING]
> This is **irreversible**. Only users with the `admin` role can execute hard deletes.

**Headers**

```
Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>
```

**cURL Example**

```bash
curl -X DELETE http://localhost:3000/api/v1/announcements/12 \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

---

### #15 · POST `/announcements/:id/like`

Toggles a like on an announcement. Calling this twice removes the like (idempotent toggle).

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/v1/announcements/:id/like` |
| **Access** | 🔴 Protected |

**Headers**

```
Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>
```

**cURL Example**

```bash
curl -X POST http://localhost:3000/api/v1/announcements/12/like \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

---

### #16 · POST `/announcements/:id/image`

Uploads an image to Supabase Storage and attaches its URL to the target announcement.

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/v1/announcements/:id/image` |
| **Access** | 🔴 Protected *(Author / Admin / Mod)* |

**Headers**

```
Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>
```

**Request Body** *(multipart/form-data)*

| Field | Type | Required | Description |
|---|---|---|---|
| `image` | `file` | ✅ Yes | PNG, JPG, or JPEG image file |

**cURL Example**

```bash
curl -X POST http://localhost:3000/api/v1/announcements/12/image \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -F "image=@/path/to/notice.jpg"
```

---

### #60 · GET `/announcements/:announcementId/comments`

Returns a paginated list of comments for the specified announcement. Comments are sorted oldest first. Deleted comments are automatically filtered out.

|||
|---|---|
| **Method** | `GET` |
| **Path** | `/api/v1/announcements/:announcementId/comments` |
| **Access** | 🟢 Public *(Optional Auth header to populate `isOwner`, `canEdit`, `canDelete` flags)* |

**Query Parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | `number` | `1` | Pagination offset |
| `limit` | `number` | `20` | Results per page |

**cURL Example**

```bash
curl -X GET "http://localhost:3000/api/v1/announcements/12/comments?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

**Response `200 OK`**

```json
{
  "success": true,
  "status": 200,
  "message": "Comments retrieved successfully",
  "data": {
    "comments": [
      {
        "commentId": 1,
        "entityType": "announcement",
        "entityId": 12,
        "parentId": null,
        "body": "This water regulation is a great decision by the Jirga.",
        "isDeleted": false,
        "createdAt": "2026-06-25T12:00:00.000Z",
        "updatedAt": "2026-06-25T12:00:00.000Z",
        "author": {
          "id": 42,
          "name": "Jane Doe",
          "avatarUrl": "https://pabaini-media/avatars/jane.jpg",
          "role": "resident"
        },
        "isOwner": true,
        "canEdit": true,
        "canDelete": true
      }
    ],
    "total": 1,
    "hasMore": false
  }
}
```

---

### #61 · POST `/announcements/:announcementId/comments`

Creates a new comment on an announcement. Atomically increments `comments_count` on the announcement.

|||
|---|---|
| **Method** | `POST` |
| **Path** | `/api/v1/announcements/:announcementId/comments` |
| **Access** | 🔴 Protected |

**Headers**

```
Content-Type: application/json
Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>
```

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `body` | `string` | ✅ Yes | Comment content |

**cURL Example**

```bash
curl -X POST http://localhost:3000/api/v1/announcements/12/comments \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"body": "Indeed, very important update."}'
```

**Response `201 Created`**

```json
{
  "success": true,
  "status": 201,
  "message": "Comment created successfully",
  "data": {
    "commentId": 2,
    "entityType": "announcement",
    "entityId": 12,
    "parentId": null,
    "body": "Indeed, very important update.",
    "isDeleted": false,
    "createdAt": "2026-06-25T12:45:00.000Z",
    "updatedAt": "2026-06-25T12:45:00.000Z",
    "author": {
      "id": 42,
      "name": "Jane Doe",
      "avatarUrl": "https://pabaini-media/avatars/jane.jpg",
      "role": "resident"
    },
    "isOwner": true,
    "canEdit": true,
    "canDelete": true
  }
}
```

---

### #62 · PATCH `/announcements/:announcementId/comments/:commentId`

Updates the body of a comment. Restricted to comment owners, admins, and moderators.

|||
|---|---|
| **Method** | `PATCH` |
| **Path** | `/api/v1/announcements/:announcementId/comments/:commentId` |
| **Access** | 🔴 Protected *(Owner / Admin / Mod)* |

**Headers**

```
Content-Type: application/json
Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>
```

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `body` | `string` | ✅ Yes | Updated comment text |

**cURL Example**

```bash
curl -X PATCH http://localhost:3000/api/v1/announcements/12/comments/2 \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"body": "Indeed, very important updates."}'
```

**Response `200 OK`**

```json
{
  "success": true,
  "status": 200,
  "message": "Comment updated successfully",
  "data": {
    "commentId": 2,
    "entityType": "announcement",
    "entityId": 12,
    "parentId": null,
    "body": "Indeed, very important updates.",
    "isDeleted": false,
    "createdAt": "2026-06-25T12:45:00.000Z",
    "updatedAt": "2026-06-25T12:46:12.000Z",
    "author": {
      "id": 42,
      "name": "Jane Doe",
      "avatarUrl": "https://pabaini-media/avatars/jane.jpg",
      "role": "resident"
    },
    "isOwner": true,
    "canEdit": true,
    "canDelete": true
  }
}
```

---

### #63 · DELETE `/announcements/:announcementId/comments/:commentId`

Soft-deletes a comment (`is_deleted = true`). Restricted to comment owners, admins, and moderators. Decrements `comments_count` on the announcement (bound to 0 minimum).

|||
|---|---|
| **Method** | `DELETE` |
| **Path** | `/api/v1/announcements/:announcementId/comments/:commentId` |
| **Access** | 🔴 Protected *(Owner / Admin / Mod)* |

**Headers**

```
Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>
```

**cURL Example**

```bash
curl -X DELETE http://localhost:3000/api/v1/announcements/12/comments/2 \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

**Response `200 OK`**

```json
{
  "success": true,
  "status": 200,
  "message": "Comment deleted successfully",
  "data": null
}
```

---

## 4. Sports Module

> Phase 1 — Cricket Player Profiles
> 
> A user can optionally register as a cricket player by setting up their profile (role, batting hand, bowling style). This creates their permanent player identity in the app that everything else — teams, matches, stats — builds on top of.
>
> Phase 2 — Cricket Teams
> 
> A registered cricket player can create a team, invite other registered players, and manage the squad. Players can also discover teams and request to join. The captain has full control over who's in the squad.

---

### Phase 1 — Cricket Player Profiles ✅ Implemented

---

### #17 · POST `/sports/cricket/players/me`

Creates a cricket player profile for the authenticated user. Each user may only have **one** profile.

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/v1/sports/cricket/players/me` |
| **Access** | 🔴 Protected |

**Headers**

```
Content-Type: application/json
Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>
```

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `role` | `string` | ✅ Yes | `batsman` · `bowler` · `allrounder` · `keeper` |
| `batting_hand` | `string` | ✅ Yes | `right` · `left` |
| `bowling_arm` | `string` | ✅ Yes | `right` · `left` · `none` |
| `bowling_type` | `string` | ✅ Yes | `fast` · `medium` · `spin` · `none` |

> [!IMPORTANT]
> If `bowling_arm` is `none`, then `bowling_type` **must** also be `none`. Mismatched values return `400 Bad Request`.

**cURL Example**

```bash
curl -X POST http://localhost:3000/api/v1/sports/cricket/players/me \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "allrounder", "batting_hand": "right", "bowling_arm": "right", "bowling_type": "medium"}'
```

**Response `201 Created`**

```json
{
  "success": true,
  "status": 201,
  "message": "Cricket player profile created successfully",
  "data": {
    "id": 1,
    "role": "allrounder",
    "batting_hand": "right",
    "bowling_arm": "right",
    "bowling_type": "medium",
    "is_active": true,
    "created_at": "2026-06-16T00:30:00.000Z",
    "updated_at": "2026-06-16T00:30:00.000Z",
    "user": {
      "id": 1,
      "name": "Ahmad Pabaini",
      "avatar_url": "https://supabase-bucket/avatars/avatar.jpg"
    }
  }
}
```

---

### #18 · GET `/sports/cricket/players/me`

Fetches the cricket profile of the currently authenticated user.

| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/v1/sports/cricket/players/me` |
| **Access** | 🔴 Protected |

**Headers**

```
Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>
```

**cURL Example**

```bash
curl -X GET http://localhost:3000/api/v1/sports/cricket/players/me \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

**Response `200 OK`** — same shape as `#17` response.

---

### #19 · PATCH `/sports/cricket/players/me`

Updates fields on the authenticated user's cricket profile. Bowling arm/type consistency is re-validated after merge.

| | |
|---|---|
| **Method** | `PATCH` |
| **Path** | `/api/v1/sports/cricket/players/me` |
| **Access** | 🔴 Protected |

**Headers**

```
Content-Type: application/json
Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>
```

**Request Body** *(all fields optional)*

| Field | Type | Description |
|---|---|---|
| `role` | `string` | `batsman` · `bowler` · `allrounder` · `keeper` |
| `batting_hand` | `string` | `right` · `left` |
| `bowling_arm` | `string` | `right` · `left` · `none` |
| `bowling_type` | `string` | `fast` · `medium` · `spin` · `none` |

> [!IMPORTANT]
> Validation runs against the **merged result** of existing + incoming values. A final state of `bowling_arm: none` with any bowling type other than `none` returns `400 Bad Request`.

**cURL Example**

```bash
curl -X PATCH http://localhost:3000/api/v1/sports/cricket/players/me \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "batsman", "bowling_arm": "none", "bowling_type": "none"}'
```

---

### #20 · GET `/sports/cricket/players/:id`

Fetches a specific player's public cricket profile by their profile ID.

| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/v1/sports/cricket/players/:id` |
| **Access** | 🟢 Public |

**Path Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | `number` | ✅ Yes | Cricket **profile** ID (not the user ID) |

**cURL Example**

```bash
curl -X GET http://localhost:3000/api/v1/sports/cricket/players/1
```

**Response `200 OK`**

```json
{
  "success": true,
  "status": 200,
  "message": "Cricket player profile retrieved successfully",
  "data": {
    "id": 1,
    "role": "batsman",
    "batting_hand": "right",
    "bowling_arm": "none",
    "bowling_type": "none",
    "is_active": true,
    "created_at": "2026-06-16T00:30:00.000Z",
    "updated_at": "2026-06-16T00:35:00.000Z",
    "user": {
      "id": 1,
      "name": "Ahmad Pabaini",
      "avatar_url": "https://supabase-bucket/avatars/avatar.jpg"
    }
  }
}
```

---

### #21 · GET `/sports/cricket/players`

Lists all active cricket players ordered by registration date (newest first) with pagination.

| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/v1/sports/cricket/players` |
| **Access** | 🟢 Public |

**Query Parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | `number` | `1` | Pagination offset |
| `limit` | `number` | `10` | Results per page *(max 50)* |

**cURL Example**

```bash
curl -X GET "http://localhost:3000/api/v1/sports/cricket/players?page=1&limit=10"
```

**Response `200 OK`**

```json
{
  "success": true,
  "status": 200,
  "message": "Cricket players list retrieved successfully",
  "data": {
    "data": [
      {
        "id": 1,
        "role": "batsman",
        "batting_hand": "right",
        "bowling_arm": "none",
        "bowling_type": "none",
        "is_active": true,
        "created_at": "2026-06-16T00:30:00.000Z",
        "updated_at": "2026-06-16T00:35:00.000Z",
        "user": {
          "id": 1,
          "name": "Ahmad Pabaini",
          "avatar_url": "https://supabase-bucket/avatars/avatar.jpg"
        }
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

### Phase 2 — Cricket Teams ✅ Implemented

---

### #22 · POST `/sports/cricket/teams`

Creates a cricket team. Current user must have set up their player profile first, which sets them as the Captain.

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/v1/sports/cricket/teams` |
| **Access** | 🔴 Protected |

**Headers**

```
Content-Type: application/json
Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>
```

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | ✅ Yes | Team name (max 100 characters, unique) |
| `description` | `string` | No | Team description |
| `home_ground` | `string` | No | Home ground name (max 200 characters) |
| `founded_year` | `number` | No | Founded year (integer >= 1900) |

**cURL Example**

```bash
curl -X POST http://localhost:3000/api/v1/sports/cricket/teams \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Pabaini XI", "description": "The best team in the village", "home_ground": "Pabaini Ground", "founded_year": 2024}'
```

**Response `201 Created`** — same shape as `#25` response (Full Team).

> [!IMPORTANT]
> **Active Captaincy Limit Rule**:
> * A player cannot create a new team if they are already the captain of **2 or more** active teams (`is_active = true`).
> * If the count is 2 or more, the endpoint rejects the request with `400 Bad Request` (`BadRequestException`).
> * **Error Message**: `"You are already captain of 2 active teams. Transfer captaincy or dissolve a team before creating a new one."`

<details>
<summary>💡 Captaincy Limit Details & Flow Diagram (Click to Expand)</summary>

### Business Validation Rules:
1. **Target**: Count active teams (`is_active = true`) where `captain_id = playerProfile.id`.
2. **Limit**: Maximum 2 active teams.
3. **Action on Violation**: Rejects with `400 BadRequestException`.
4. **Action on Success**: Proceed with team creation and roster registration in transaction.

### Flow Diagram:
```mermaid
graph TD
    User([User calls POST /sports/cricket/teams]) --> GetProfile[Fetch player profile from DB]
    GetProfile --> CountCap[Count active teams captained by player]
    CountCap --> LimitCheck{Is count >= 2?}
    LimitCheck -->|Yes| ThrowBad[Throw 400 BadRequestException]
    LimitCheck -->|No| CheckName[Verify name uniqueness]
    CheckName --> ExistCheck{Name exists?}
    ExistCheck -->|Yes| ThrowConflict[Throw 409 ConflictException]
    ExistCheck -->|No| StartTx[Start Database Transaction]
    StartTx --> CreateTeam[Save team record]
    CreateTeam --> AddCaptain[Add player to roster as CAPTAIN and ACTIVE]
    AddCaptain --> CommitTx[Commit Transaction]
    CommitTx --> ReturnTeam[Return Full Team details]
```
</details>

---

### #23 · GET `/sports/cricket/teams`

Lists active cricket teams with optional pagination and name filtering.

| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/v1/sports/cricket/teams` |
| **Access** | 🟢 Public |

**Query Parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | `number` | `1` | Page number |
| `limit` | `number` | `10` | Results per page |
| `search` | `string` | — | Plaintext search matching team name |

**cURL Example**

```bash
curl -X GET "http://localhost:3000/api/v1/sports/cricket/teams?page=1&limit=10&search=Pabaini"
```

**Response `200 OK`**

```json
{
  "success": true,
  "status": 200,
  "message": "Teams list retrieved successfully",
  "data": {
    "data": [
      {
        "id": 1,
        "name": "Pabaini XI",
        "logo_url": null,
        "home_ground": "Pabaini Ground",
        "founded_year": 2024,
        "captain": {
          "id": 1,
          "user": { "id": 1, "name": "Ahmad Khan", "avatar_url": null }
        },
        "member_count": 8,
        "created_at": "2026-06-12T01:10:00.000Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

### #24 · GET `/sports/cricket/teams/my`

Lists all teams where the authenticated user is currently an active member.

| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/v1/sports/cricket/teams/my` |
| **Access** | 🔴 Protected |

**Headers**

```
Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>
```

**cURL Example**

```bash
curl -X GET http://localhost:3000/api/v1/sports/cricket/teams/my \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

**Response `200 OK`**

```json
{
  "success": true,
  "status": 200,
  "data": [
    {
      "id": 1,
      "name": "Pabaini XI",
      "logo_url": null,
      "home_ground": "Pabaini Ground",
      "founded_year": 2024,
      "captain": {
        "id": 1,
        "user": { "id": 1, "name": "Ahmad Khan", "avatar_url": null }
      },
      "role": "captain",
      "joined_at": "2026-06-12T01:10:00.000Z"
    }
  ]
}
```

---

### #25 · GET `/sports/cricket/teams/:id`

Retrieves full cricket team details with its active squad members.

| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/v1/sports/cricket/teams/:id` |
| **Access** | 🟢 Public |

**Path Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | `number` | ✅ Yes | Team ID |

**cURL Example**

```bash
curl -X GET http://localhost:3000/api/v1/sports/cricket/teams/1
```

**Response `200 OK`**

```json
{
  "success": true,
  "status": 200,
  "data": {
    "id": 1,
    "name": "Pabaini XI",
    "description": "The best team in the village",
    "logo_url": null,
    "home_ground": "Pabaini Ground",
    "founded_year": 2024,
    "captain": {
      "id": 1,
      "user": { "id": 1, "name": "Ahmad Khan", "avatar_url": null }
    },
    "members": [
      {
        "id": 1,
        "role": "captain",
        "status": "active",
        "joined_at": "2026-06-12T01:10:00.000Z",
        "player": {
          "id": 1,
          "role": "allrounder",
          "batting_hand": "right",
          "user": { "id": 1, "name": "Ahmad Khan", "avatar_url": null }
        }
      }
    ]
  }
}
```

---

### #26 · PATCH `/sports/cricket/teams/:id`

Updates team details. Restricted to the Team Captain.

| | |
|---|---|
| **Method** | `PATCH` |
| **Path** | `/api/v1/sports/cricket/teams/:id` |
| **Access** | 🔴 Protected *(Captain only)* |

**Headers**

```
Content-Type: application/json
Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>
```

**Request Body** *(all fields optional)*

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Team name (max 100 characters, unique) |
| `description` | `string` | Team description |
| `home_ground` | `string` | Home ground name (max 200 characters) |
| `founded_year` | `number` | Founded year (integer >= 1900) |

**cURL Example**

```bash
curl -X PATCH http://localhost:3000/api/v1/sports/cricket/teams/1 \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"home_ground": "New Pabaini Oval"}'
```

**Response `200 OK`** — same shape as `#25` response (Full Team).

---

### #27 · POST `/sports/cricket/teams/:id/logo`

Uploads or replaces the team logo. Restricted to the Team Captain.

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/v1/sports/cricket/teams/:id/logo` |
| **Access** | 🔴 Protected *(Captain only)* |

**Headers**

```
Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>
```

**Request Body** *(multipart/form-data)*

| Field | Type | Required | Description |
|---|---|---|---|
| `logo` | `file` | ✅ Yes | Team logo image file (PNG, JPG, JPEG) |

**cURL Example**

```bash
curl -X POST http://localhost:3000/api/v1/sports/cricket/teams/1/logo \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -F "logo=@/path/to/logo.png"
```

**Response `201 Created`** — same shape as `#25` response (Full Team).

---

### #28 · POST `/sports/cricket/teams/:id/invite`

Invites a registered player to join the team. Restricted to the Team Captain.

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/v1/sports/cricket/teams/:id/invite` |
| **Access** | 🔴 Protected *(Captain only)* |

**Headers**

```
Content-Type: application/json
Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>
```

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `player_id` | `number` | ✅ Yes | Target player profile ID to invite |

**cURL Example**

```bash
curl -X POST http://localhost:3000/api/v1/sports/cricket/teams/1/invite \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"player_id": 2}'
```

**Response `201 Created`**

```json
{
  "success": true,
  "status": 201,
  "data": {
    "message": "Invitation sent successfully"
  }
}
```

---

### #29 · POST `/sports/cricket/teams/:id/request`

Sends a request to join a team. Current user must have a player profile.

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/v1/sports/cricket/teams/:id/request` |
| **Access** | 🔴 Protected |

**Headers**

```
Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>
```

**cURL Example**

```bash
curl -X POST http://localhost:3000/api/v1/sports/cricket/teams/1/request \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

**Response `201 Created`**

```json
{
  "success": true,
  "status": 201,
  "data": {
    "message": "Join request sent successfully"
  }
}
```

---

### #30 · GET `/sports/cricket/teams/:id/members/pending`

Retrieves pending invites and join requests for the team. Restricted to the Team Captain.

| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/v1/sports/cricket/teams/:id/members/pending` |
| **Access** | 🔴 Protected *(Captain only)* |

**Headers**

```
Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>
```

**cURL Example**

```bash
curl -X GET http://localhost:3000/api/v1/sports/cricket/teams/1/members/pending \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

**Response `200 OK`**

```json
{
  "success": true,
  "status": 200,
  "data": {
    "pending_requests": [
      {
        "id": 5,
        "role": "player",
        "status": "pending_request",
        "player": {
          "id": 2,
          "role": "bowler",
          "batting_hand": "right",
          "user": { "id": 2, "name": "Zia Khan", "avatar_url": null }
        }
      }
    ],
    "pending_invites": []
  }
}
```

---

### #31 · PATCH `/sports/cricket/teams/:id/members/:memberId/accept`

Accepts a pending team invitation (player) or a join request (captain).

| | |
|---|---|
| **Method** | `PATCH` |
| **Path** | `/api/v1/sports/cricket/teams/:id/members/:memberId/accept` |
| **Access** | 🔴 Protected |

**Headers**

```
Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>
```

**cURL Example**

```bash
curl -X PATCH http://localhost:3000/api/v1/sports/cricket/teams/1/members/5/accept \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

**Response `200 OK`**

```json
{
  "success": true,
  "status": 200,
  "data": {
    "id": 5,
    "team_id": 1,
    "player_id": 2,
    "role": "player",
    "status": "active",
    "joined_at": "2026-06-16T05:35:00.000Z"
  }
}
```

---

### #32 · PATCH `/sports/cricket/teams/:id/members/:memberId/reject`

Rejects a join request (captain) or declines a team invitation (player).

| | |
|---|---|
| **Method** | `PATCH` |
| **Path** | `/api/v1/sports/cricket/teams/:id/members/:memberId/reject` |
| **Access** | 🔴 Protected |

**Headers**

```
Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>
```

**cURL Example**

```bash
curl -X PATCH http://localhost:3000/api/v1/sports/cricket/teams/1/members/5/reject \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

**Response `200 OK`**

```json
{
  "success": true,
  "status": 200,
  "data": {
    "message": "Rejected successfully"
  }
}
```

---

### #33 · DELETE `/sports/cricket/teams/:id/members/:memberId`

Removes a player from the squad (captain) or allows a member to leave (player).

| | |
|---|---|
| **Method** | `DELETE` |
| **Path** | `/api/v1/sports/cricket/teams/:id/members/:memberId` |
| **Access** | 🔴 Protected |

**Headers**

```
Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>
```

**cURL Example**

```bash
curl -X DELETE http://localhost:3000/api/v1/sports/cricket/teams/1/members/5 \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

**Response `200 OK`**

```json
{
  "success": true,
  "status": 200,
  "data": {
    "message": "Left team successfully"
  }
}
```

---

### #34 · PATCH `/sports/cricket/teams/:id/captain`

Transfers team captaincy. Restricted to the current Team Captain.

| | |
|---|---|
| **Method** | `PATCH` |
| **Path** | `/api/v1/sports/cricket/teams/:id/captain` |
| **Access** | 🔴 Protected *(Captain only)* |

**Headers**

```
Content-Type: application/json
Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>
```

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `player_id` | `number` | ✅ Yes | Target player profile ID to receive captaincy |

**cURL Example**

```bash
curl -X PATCH http://localhost:3000/api/v1/sports/cricket/teams/1/captain \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"player_id": 2}'
```

**Response `200 OK`** — same shape as `#25` response (Full Team).

---

### #35 · DELETE `/sports/cricket/teams/:id`

Soft deletes a team. Sets the team as inactive and removes all members. Cannot be undone. Teams with match history cannot be deleted (enforced in a future update).

| | |
|---|---|
| **Method** | `DELETE` |
| **Path** | `/api/v1/sports/cricket/teams/:id` |
| **Access** | 🔴 Protected *(Captain only)* |

**Headers**

```
Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>
```

**Path Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | `number` | ✅ Yes | Team ID to soft delete |

**cURL Example**

```bash
curl -X DELETE http://localhost:3000/api/v1/sports/cricket/teams/1 \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

**Response `200 OK`**

```json
{
  "success": true,
  "status": 200,
  "data": {
    "message": "Team deleted successfully"
  }
}
```

---

## 6. Notifications Module

The Notifications Module provides a centralized feed, unread notification counts, and bulk read markers for all features across the Pabaini ecosystem.

<details>
<summary>💡 System Architecture, Flows & Techniques (Click to Expand)</summary>

### Asynchronous Event-Driven Flow
Notifications are decoupled from the core business logic of other modules using NestJS `EventEmitter2` event-driven architecture. 

```mermaid
sequenceDiagram
    autonumber
    participant Player as Player / Captain
    participant TS as TeamsService
    participant NS as NotificationsService
    participant DB as PostgreSQL Database
    participant EE2 as EventEmitter2 (Events)
    participant NC as NotificationsController
    participant UI as Frontend App

    Note over Player, TS: Trigger Action (e.g. Join Request, Invite)
    Player->>TS: Call team action API
    TS->>DB: Process team action (save squad membership)
    DB-->>TS: Transaction Success
    
    Note over TS, NS: Dispatch Notification Asynchronously (try/catch)
    TS->>NS: notificationsService.create(payload)
    NS->>DB: Save Notification (user_id, type, title, deep_link, metadata)
    DB-->>NS: Saved Record
    NS->>EE2: Emit event 'notification.created'
    NS-->>TS: Notification Success / Failure ignored
    TS-->>Player: Return core action response (Success)

    Note over UI, NC: Fetching Notifications
    UI->>NC: GET /api/v1/notifications (with query filters)
    NC->>NS: findForUser(userId, query)
    NS->>DB: Query notifications (indexed on user_id, is_read, created_at)
    DB-->>NS: Return records & total count
    NS-->>NC: Return paginated object
    NC-->>UI: Return response envelope { success, status, data }
```

### Engineering & Database Optimization Techniques:
1. **Composite Performance Index**: A composite index is defined on `(user_id, is_read, created_at)` columns. This ensures that unread count polling and chronological paginated list queries scale efficiently to millions of notifications.
2. **Bulk Read Operations**: The `/notifications/read-all` endpoint executes a bulk SQL `UPDATE` instead of retrieving and saving individual models, saving database connections and memory.
3. **Transaction Safety**: All triggers inside `TeamsService` are wrapped in `try/catch` handlers. Any notification failure is logged as a warning but will **never** fail or roll back the core team operation.

</details>

---

### #36 · GET `/notifications`

Retrieves a paginated list of notifications for the authenticated user, ordered by newest first.

| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/v1/notifications` |
| **Access** | 🔐 Protected *(Resident / Moderator / Admin)* |
| **Status** | ✅ Live |

**Request Headers**

| Header | Value | Description |
|---|---|---|
| `Authorization` | `Bearer <YOUR_FIREBASE_ID_TOKEN>` | Required Firebase session token |

**Query Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `unread_only` | `string` | No | Set to `'true'` to fetch only unread notifications |
| `page` | `string` | No | Page index (defaults to `'1'`) |
| `limit` | `string` | No | Items per page (defaults to `'20'`) |

**Example Response (200 OK)**

```json
{
  "success": true,
  "status": 200,
  "data": {
    "notifications": [
      {
        "id": 1,
        "user_id": 13,
        "type": "team_invite",
        "title": "You were invited to join Pabaini Kings",
        "body": null,
        "deep_link": "/sports/cricket/teams/2",
        "metadata": {
          "team_id": 2
        },
        "is_read": false,
        "created_at": "2026-06-16T10:12:30.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20
  }
}
```

---

### #37 · GET `/notifications/unread-count`

Retrieves the lightweight count of unread notifications for the authenticated user.

| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/v1/notifications/unread-count` |
| **Access** | 🔐 Protected *(Resident / Moderator / Admin)* |
| **Status** | ✅ Live |

**Request Headers**

| Header | Value | Description |
|---|---|---|
| `Authorization` | `Bearer <YOUR_FIREBASE_ID_TOKEN>` | Required Firebase session token |

**Example Response (200 OK)**

```json
{
  "success": true,
  "status": 200,
  "data": 1
}
```

---

### #38 · PATCH `/notifications/read-all`

Marks all unread notifications of the authenticated user as read.

| | |
|---|---|
| **Method** | `PATCH` |
| **Path** | `/api/v1/notifications/read-all` |
| **Access** | 🔐 Protected *(Resident / Moderator / Admin)* |
| **Status** | ✅ Live |

**Request Headers**

| Header | Value | Description |
|---|---|---|
| `Authorization` | `Bearer <YOUR_FIREBASE_ID_TOKEN>` | Required Firebase session token |

**Example Response (200 OK)**

```json
{
  "success": true,
  "status": 200,
  "data": {
    "updated": 1
  }
}
```

---

### #39 · PATCH `/notifications/:id/read`

Marks a single notification as read, validating ownership.

| | |
|---|---|
| **Method** | `PATCH` |
| **Path** | `/api/v1/notifications/:id/read` |
| **Access** | 🔐 Protected *(Resident / Moderator / Admin)* |
| **Status** | ✅ Live |

**Request Headers**

| Header | Value | Description |
|---|---|---|
| `Authorization` | `Bearer <YOUR_FIREBASE_ID_TOKEN>` | Required Firebase session token |

**Path Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | `number` | Yes | ID of the notification to mark as read |

**Example Response (200 OK)**

```json
{
  "success": true,
  "status": 200,
  "data": {
    "id": 1,
    "user_id": 13,
    "type": "team_invite",
    "title": "You were invited to join Pabaini Kings",
    "body": null,
    "deep_link": "/sports/cricket/teams/2",
    "metadata": {
      "team_id": 2
    },
    "is_read": true,
    "created_at": "2026-06-16T10:12:30.000Z"
  }
}
```

---

## 7. Sports Module — Phase 3 (Matches & Lineups)

The Matches module handles challenges between team captains, schedule status transitions, and playing XI declarations.

---

### #40 · POST `/sports/cricket/matches/request`

Challenges another team. Only available to team captains.

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/v1/sports/cricket/matches/request` |
| **Access** | 🔴 Protected *(Captain only)* |
| **Status** | ✅ Live |

**Headers**

```
Content-Type: application/json
Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>
```

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `opponent_team_id` | `number` | ✅ Yes | ID of the team being challenged |
| `overs` | `number` | ✅ Yes | Total overs per innings (minimum 1) |
| `scoring_mode` | `string` | ✅ Yes | Scoring style: `'simple'` or `'live'` |
| `venue` | `string` | No | Ground name or venue |
| `scheduled_at` | `string` | No | ISO-8601 schedule timestamp |

**cURL Example**

```bash
curl -X POST http://localhost:3000/api/v1/sports/cricket/matches/request \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "opponent_team_id": 2,
    "overs": 20,
    "scoring_mode": "simple",
    "venue": "Pabaini Cricket Ground",
    "scheduled_at": "2026-06-25T17:00:00.000Z"
  }'
```

**Response `201 Created`**

```json
{
  "success": true,
  "status": 201,
  "data": {
    "id": 1,
    "series_id": null,
    "tournament_id": null,
    "team_a_id": 1,
    "team_b_id": 2,
    "requested_by": 1,
    "overs": 20,
    "venue": "Pabaini Cricket Ground",
    "scheduled_at": "2026-06-25T17:00:00.000Z",
    "scoring_mode": "simple",
    "scorer_id": null,
    "status": "pending_request",
    "winner_team_id": null,
    "man_of_match_id": null,
    "team_a_score": null,
    "team_b_score": null,
    "team_a_lineup_set": false,
    "team_b_lineup_set": false,
    "created_at": "2026-06-19T01:30:00.000Z",
    "updated_at": "2026-06-19T01:30:00.000Z"
  }
}
```

---

### #41 · GET `/sports/cricket/matches`

Lists matches with optional status, team, and name/venue search filtering.

| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/v1/sports/cricket/matches` |
| **Access** | 🟢 Public |
| **Status** | ✅ Live |

**Query Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `status` | `string` | No | Match status filter (e.g. `'pending_request'`, `'scheduled'`) |
| `team_id` | `number` | No | Team ID filter (retrieves matches where team is team A or B) |
| `search` | `string` | No | Plaintext search matching team names or venue |
| `page` | `number` | No | Page number (defaults to `1`) |
| `limit` | `number` | No | Items per page (defaults to `20`) |

**cURL Example**

```bash
curl -X GET "http://localhost:3000/api/v1/sports/cricket/matches?team_id=1&page=1&limit=10&search=Pabaini"
```

**Response `200 OK`**

```json
{
  "success": true,
  "status": 200,
  "message": "Matches retrieved successfully",
  "data": {
    "data": [
      {
        "id": 1,
        "series_id": null,
        "tournament_id": null,
        "team_a_id": 1,
        "team_b_id": 2,
        "requested_by": 1,
        "overs": 20,
        "venue": "Pabaini Cricket Ground",
        "scheduled_at": "2026-06-25T17:00:00.000Z",
        "scoring_mode": "simple",
        "scorer_id": null,
        "status": "scheduled",
        "winner_team_id": null,
        "man_of_match_id": null,
        "team_a_score": null,
        "team_b_score": null,
        "team_a_lineup_set": false,
        "team_b_lineup_set": false,
        "created_at": "2026-06-19T01:30:00.000Z",
        "updated_at": "2026-06-19T01:35:00.000Z",
        "team_a": {
          "id": 1,
          "name": "Pabaini Kings"
        },
        "team_b": {
          "id": 2,
          "name": "Pabaini Stars"
        }
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```
```

---

### #42 · GET `/sports/cricket/matches/:id`

Retrieves full match details. For completed matches, this response includes dynamically aggregated batsman strike rates, bowler economy rates, bowler maidens count, innings-specific byes/leg-byes, and chronological fall of wickets timeline.

| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/v1/sports/cricket/matches/:id` |
| **Access** | 🟢 Public |
| **Status** | ✅ Live |

**cURL Example**

```bash
curl -X GET http://localhost:3000/api/v1/sports/cricket/matches/1
```

**Response `200 OK` (Completed Live Match)**

```json
{
  "success": true,
  "status": 200,
  "data": {
    "id": 1,
    "series_id": null,
    "tournament_id": null,
    "team_a_id": 1,
    "team_b_id": 2,
    "requested_by": 5,
    "overs": 20,
    "venue": "Pabaini Main Ground",
    "scheduled_at": "2026-06-22T14:00:00.000Z",
    "scoring_mode": "live",
    "scorer_id": 5,
    "status": "completed",
    "winner_team_id": 1,
    "man_of_match_id": 12,
    "team_a_score": "154/8 (20.0)",
    "team_b_score": "142/10 (19.4)",
    "team_a_lineup_set": true,
    "team_b_lineup_set": true,
    "current_innings": 2,
    "current_over": 19,
    "current_ball": 4,
    "current_batting_team_id": 2,
    "striker_id": null,
    "striker_guest_name": null,
    "non_striker_id": null,
    "non_striker_guest_name": null,
    "current_bowler_id": null,
    "current_bowler_guest_name": null,
    "innings_1_score": 154,
    "innings_1_wickets": 8,
    "innings_1_overs": "20.0",
    "innings_1_batting_team_id": 1,
    "innings_2_score": 142,
    "innings_2_wickets": 10,
    "innings_2_overs": "19.4",
    "innings_2_batting_team_id": 2,
    "target": 155,
    "is_tie": false,
    "result_submitted_at": "2026-06-22T17:45:00.000Z",
    "result_locked_at": "2026-06-23T17:45:00.000Z",
    "created_at": "2026-06-22T12:00:00.000Z",
    "updated_at": "2026-06-22T17:45:00.000Z",
    "team_a": {
      "id": 1,
      "name": "Pabaini XI",
      "logo_url": "https://..."
    },
    "team_b": {
      "id": 2,
      "name": "Nataar Eleven",
      "logo_url": "https://..."
    },
    "player_stats": [
      {
        "id": 41,
        "match_id": 1,
        "team_id": 1,
        "player_id": 12,
        "guest_name": null,
        "name": "Ahmad khan",
        "avatar_url": "https://...",
        "runs": 45,
        "balls_faced": 30,
        "fours": 4,
        "sixes": 2,
        "how_out": "caught",
        "is_not_out": false,
        "overs_bowled": "4.0",
        "runs_given": 24,
        "wickets": 3,
        "wides": 2,
        "no_balls": 0,
        "maidens": 0,
        "created_at": "2026-06-22T17:45:00.000Z",
        "updated_at": "2026-06-22T17:45:00.000Z"
      },
      {
        "id": 42,
        "match_id": 1,
        "team_id": 1,
        "player_id": null,
        "guest_name": "Hamza Guest",
        "name": "Hamza Guest",
        "avatar_url": null,
        "runs": 0,
        "balls_faced": 0,
        "fours": 0,
        "sixes": 0,
        "how_out": null,
        "is_not_out": false,
        "overs_bowled": "3.0",
        "runs_given": 12,
        "wickets": 1,
        "wides": 0,
        "no_balls": 1,
        "maidens": 1,
        "created_at": "2026-06-22T17:45:00.000Z",
        "updated_at": "2026-06-22T17:45:00.000Z"
      }
    ],
    "is_result_editable": true,
    "innings_1_byes": 2,
    "innings_1_leg_byes": 1,
    "innings_2_byes": 0,
    "innings_2_leg_byes": 4,
    "fall_of_wickets": [
      {
        "player_name": "Ahmad khan",
        "wicket_type": "caught",
        "over": "8.3",
        "score_at_wicket": 65,
        "innings": 1
      },
      {
        "player_name": "Hamza Guest",
        "wicket_type": "bowled",
        "over": "19.4",
        "score_at_wicket": 142,
        "innings": 2
      }
    ]
  }
}
```

---

### #43 · PATCH `/sports/cricket/matches/:id/accept`

Accepts a match request. Only available to the challenged team captain (`team_b`).

| | |
|---|---|
| **Method** | `PATCH` |
| **Path** | `/api/v1/sports/cricket/matches/:id/accept` |
| **Access** | 🔴 Protected *(Team B Captain only)* |
| **Status** | ✅ Live |

**Headers**

```
Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>
```

**cURL Example**

```bash
curl -X PATCH http://localhost:3000/api/v1/sports/cricket/matches/1/accept \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

**Response `200 OK`** (returns updated match, status changed to `'scheduled'`).

---

### #44 · PATCH `/sports/cricket/matches/:id/decline`

Declines a match request. Only available to the challenged team captain (`team_b`).

| | |
|---|---|
| **Method** | `PATCH` |
| **Path** | `/api/v1/sports/cricket/matches/:id/decline` |
| **Access** | 🔴 Protected *(Team B Captain only)* |
| **Status** | ✅ Live |

**cURL Example**

```bash
curl -X PATCH http://localhost:3000/api/v1/sports/cricket/matches/1/decline \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

**Response `200 OK`**

```json
{
  "message": "Match request declined"
}
```

---

### #45 · PATCH `/sports/cricket/matches/:id`

Updates details of a pending match request. Only available to the challenging captain (`requested_by`) while status is `'pending_request'`.

| | |
|---|---|
| **Method** | `PATCH` |
| **Path** | `/api/v1/sports/cricket/matches/:id` |
| **Access** | 🔴 Protected *(Requesting Captain only)* |
| **Status** | ✅ Live |

**Headers**

```
Content-Type: application/json
Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>
```

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `overs` | `number` | No | Over counts (minimum 1) |
| `scoring_mode` | `string` | No | `'simple'` or `'live'` |
| `venue` | `string` | No | Ground name or venue |
| `scheduled_at` | `string` | No | ISO-8601 schedule timestamp |

**cURL Example**

```bash
curl -X PATCH http://localhost:3000/api/v1/sports/cricket/matches/1 \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"overs": 15, "venue": "New Ground"}'
```

---

### #47 · PATCH `/sports/cricket/matches/:id/cancel`

Cancels a match.
- If status is `pending_request`: Only the challenger (`requested_by`) can cancel.
- If status is `scheduled`: Either team's captain can cancel.

| | |
|---|---|
| **Method** | `PATCH` |
| **Path** | `/api/v1/sports/cricket/matches/:id/cancel` |
| **Access** | 🔴 Protected |
| **Status** | ✅ Live |

**cURL Example**

```bash
curl -X PATCH http://localhost:3000/api/v1/sports/cricket/matches/1/cancel \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

---

### #48 · POST `/sports/cricket/matches/:id/lineup`

Declares a team's playing lineup (6 to 11 players). Only available to the captains of Team A or Team B. Match status must be `scheduled`.

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/v1/sports/cricket/matches/:id/lineup` |
| **Access** | 🔴 Protected *(Captain only)* |
| **Status** | ✅ Live |

**Headers**

```
Content-Type: application/json
Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>
```

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `players` | `array` | ✅ Yes | Array containing between 6 and 11 player objects |

**Lineup Player Object**

| Field | Type | Required | Description |
|---|---|---|---|
| `player_id` | `number` | No | Member profile ID (if registered, must be an active squad member) |
| `guest_name` | `string` | No | Display name (if unregistered guest player) |
| `batting_order` | `number` | ✅ Yes | Order rank index between 1 and the total player count (must be unique) |

*Note: Either `player_id` or `guest_name` must be set, but not both.*

**cURL Example**

```bash
curl -X POST http://localhost:3000/api/v1/sports/cricket/matches/1/lineup \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "players": [
      { "player_id": 1, "batting_order": 1 },
      { "player_id": 3, "batting_order": 2 },
      { "guest_name": "Hamza (Guest)", "batting_order": 3 },
      { "player_id": 4, "batting_order": 4 },
      { "player_id": 5, "batting_order": 5 },
      { "player_id": 6, "batting_order": 6 },
      { "player_id": 7, "batting_order": 7 },
      { "player_id": 8, "batting_order": 8 },
      { "player_id": 9, "batting_order": 9 },
      { "player_id": 10, "batting_order": 10 },
      { "player_id": 11, "batting_order": 11 }
    ]
  }'
```

**Response `201 Created`**

```json
{
  "success": true,
  "status": 201,
  "data": [
    {
      "id": 1,
      "match_id": 1,
      "team_id": 1,
      "player_id": 1,
      "guest_name": null,
      "batting_order": 1
    }
  ],
  "message": "Lineup declared successfully"
}
```

---

### #49 · GET `/sports/cricket/matches/:id/lineup`

Retrieves both teams' declared lineups.

| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/v1/sports/cricket/matches/:id/lineup` |
| **Access** | 🟢 Public |
| **Status** | ✅ Live |

**cURL Example**

```bash
curl -X GET http://localhost:3000/api/v1/sports/cricket/matches/1/lineup
```

**Response `200 OK`**

```json
{
  "success": true,
  "status": 200,
  "data": {
    "team_a": {
      "lineup_set": true,
      "players": [
        {
          "id": 1,
          "batting_order": 1,
          "player_id": 1,
          "guest_name": null,
          "name": "Ahmad",
          "avatar_url": "https://xyz.supabase.co/storage/v1/object/public/pabaini-media/profiles/1.png"
        }
      ]
    },
    "team_b": {
      "lineup_set": false,
      "players": []
    }
  }
}
```

---

## 8. Sports Module — Phase 3 (Simple Scoring Mode) ✅ Implemented

These endpoints allow team captains to submit and edit match result scorecards, calculating career statistics updates in background transactions.

---

### #50 · POST `/sports/cricket/matches/:id/result`

Submits the final scorecard result. The match status becomes `'completed'` and career profile statistics are updated dynamically.

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/v1/sports/cricket/matches/:id/result` |
| **Access** | 🔴 Protected *(Team A or Team B Captain only)* |
| **Status** | ✅ Live |

**Headers**

```
Content-Type: application/json
Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>
```

**Request Body (`SubmitResultDto`)**

| Field | Type | Required | Description |
|---|---|---|---|
| `winner_team_id` | `number` | ✅ Yes | ID of the winning team |
| `man_of_match_id` | `number` | No | Player profile ID of the Man of the Match (registered player) |
| `man_of_match_guest_name` | `string` | No | Guest player name of the Man of the Match |
| `team_a_score` | `string` | ✅ Yes | Team A final score, e.g. `"152/5 (20)"` |
| `team_b_score` | `string` | ✅ Yes | Team B final score, e.g. `"153/3 (19.2)"` |
| `player_stats` | `array` | ✅ Yes | Array of `PlayerStatDto` player statistics |

**PlayerStatDto Object**

| Field | Type | Required | Description |
|---|---|---|---|
| `player_id` | `number` | No | Registered player profile ID (required if not guest) |
| `guest_name` | `string` | No | Guest player name (required if not registered) |
| `team_id` | `number` | ✅ Yes | Team ID the player belongs to |
| `runs` | `number` | ✅ Yes | Batting runs scored (min 0) |
| `balls_faced` | `number` | ✅ Yes | Batting balls faced (min 0) |
| `fours` | `number` | ✅ Yes | Batting fours hit (min 0) |
| `sixes` | `number` | ✅ Yes | Batting sixes hit (min 0) |
| `how_out` | `string` | No | Dismissal type (`'bowled'`, `'caught'`, `'run_out'`, `'lbw'`, `'stumped'`, `'hit_wicket'`, `'retired'`) |
| `is_not_out` | `boolean` | ✅ Yes | Batsman status (not out) |
| `overs_bowled` | `number` | ✅ Yes | Bowling overs bowled, e.g. `3.4` (min 0) |
| `runs_given` | `number` | ✅ Yes | Bowling runs conceded (min 0) |
| `wickets` | `number` | ✅ Yes | Bowling wickets taken (min 0) |
| `wides` | `number` | ✅ Yes | Bowling wides conceded (min 0) |
| `no_balls` | `number` | ✅ Yes | Bowling no-balls conceded (min 0) |

**cURL Example**

```bash
curl -X POST http://localhost:3000/api/v1/sports/cricket/matches/1/result \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "winner_team_id": 1,
    "man_of_match_id": 2,
    "team_a_score": "120/4 (20)",
    "team_b_score": "121/2 (18.4)",
    "player_stats": [
      {
        "player_id": 2,
        "team_id": 1,
        "runs": 45,
        "balls_faced": 30,
        "fours": 5,
        "sixes": 1,
        "how_out": "caught",
        "is_not_out": false,
        "overs_bowled": 3.0,
        "runs_given": 18,
        "wickets": 2,
        "wides": 1,
        "no_balls": 0
      }
    ]
  }'
```

---

### #51 · PATCH `/sports/cricket/matches/:id/result`

Edits a submitted match result. Allowed only within 24 hours of result submission.

| | |
|---|---|
| **Method** | `PATCH` |
| **Path** | `/api/v1/sports/cricket/matches/:id/result` |
| **Access** | 🔴 Protected *(Team A or Team B Captain only)* |
| **Status** | ✅ Live |

**Request Body (`EditResultDto`)**

*All fields are optional for partial updates. If `player_stats` is provided, all old stats for the match are replaced and aggregates recalculated.*

**cURL Example**

```bash
curl -X PATCH http://localhost:3000/api/v1/sports/cricket/matches/1/result \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "team_a_score": "122/4 (20)"
  }'
```

---

## 9. Sports Module — Phase 3 (Live Scoring) ✅ Implemented

These endpoints allow a designated scorer to record ball-by-ball events for live matches, update match live state in real-time, and allow any user to retrieve near real-time live match scorecard views.

---

### #52 · PATCH `/sports/cricket/matches/:id/start`

Starts live scoring for a scheduled match. Status transitions to `live`.

| | |
|---|---|
| **Method** | `PATCH` |
| **Path** | `/api/v1/sports/cricket/matches/:id/start` |
| **Access** | 🔴 Protected *(Team A or Team B Captain only)* |
| **Status** | ✅ Live |

**Headers**

```
Content-Type: application/json
Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>
```

**Request Body (`StartMatchDto`)**

| Field | Type | Required | Description |
|---|---|---|---|
| `scorer_id` | `number` | No | ID of the designated scorer player (optional, defaults to captain) |
| `toss_winner_team_id` | `number` | ✅ Yes | ID of the team that won the toss |
| `batting_first_team_id` | `number` | ✅ Yes | ID of the team batting first |
| `opening_striker_id` | `number` | No | ID of the opening striker batsman |
| `opening_striker_guest_name` | `string` | No | Guest name of the opening striker (if unregistered) |
| `opening_non_striker_id` | `number` | No | ID of the opening non-striker batsman |
| `opening_non_striker_guest_name` | `string` | No | Guest name of the opening non-striker (if unregistered) |
| `opening_bowler_id` | `number` | No | ID of the opening bowler |
| `opening_bowler_guest_name` | `string` | No | Guest name of the opening bowler (if unregistered) |

**cURL Example**

```bash
curl -X PATCH http://localhost:3000/api/v1/sports/cricket/matches/1/start \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "toss_winner_team_id": 1,
    "batting_first_team_id": 1,
    "opening_striker_id": 1,
    "opening_non_striker_id": 3,
    "opening_bowler_id": 4
  }'
```

---

### #53 · POST `/sports/cricket/matches/:id/balls`

Records a single delivery event. Modifies scores, wickets, overs, legal balls, strike rotations, and handles wickets.

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/v1/sports/cricket/matches/:id/balls` |
| **Access** | 🔴 Protected *(Assigned Scorer only)* |
| **Status** | ✅ Live |

**Headers**

```
Content-Type: application/json
Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>
```

**Request Body (`RecordBallDto`)**

| Field | Type | Required | Description |
|---|---|---|---|
| `runs` | `number` | ✅ Yes | Runs scored off the bat (0–6) |
| `extra_type` | `string` | No | Extra delivery type: `wide` · `no_ball` · `bye` · `leg_bye` · `penalty` |
| `extra_runs` | `number` | No | Extra runs conceded (default 0) |
| `is_wicket` | `boolean` | ✅ Yes | Set to `true` if a wicket fell |
| `wicket_type` | `string` | No | Dismissal type: `bowled` · `caught` · `caught_behind` · `run_out` · `lbw` · `stumped` · `retired` · `hit_wicket` · `handled_ball` · `double_hit` · `obstructing_field` · `timed_out` |
| `next_batsman_id` | `number` | No | ID of the incoming batsman (required if wicket falls and wickets < 10) |
| `next_batsman_guest_name` | `string` | No | Guest name of the incoming batsman (required if wicket falls and wickets < 10) |

**cURL Example**

```bash
curl -X POST http://localhost:3000/api/v1/sports/cricket/matches/1/balls \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "runs": 1,
    "extra_type": null,
    "extra_runs": 0,
    "is_wicket": false
  }'
```

---

### #54 · PATCH `/sports/cricket/matches/:id/bowler`

Sets the bowler for the next over. Prevents consecutive overs from the same bowler, unless `bypass_consecutive_check` is enabled. The endpoint is idempotent; if the requested bowler is already active for the over, it returns the current match state instead of throwing an error.

| | |
|---|---|
| **Method** | `PATCH` |
| **Path** | `/api/v1/sports/cricket/matches/:id/bowler` |
| **Access** | 🔴 Protected *(Assigned Scorer only)* |
| **Status** | ✅ Live |

**Headers**

```
Content-Type: application/json
Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>
```

**Request Body (`SelectBowlerDto`)**

| Field | Type | Required | Description |
|---|---|---|---|
| `bowler_id` | `number` | No | ID of the new bowler player |
| `bowler_guest_name` | `string` | No | Guest name of the new bowler (if unregistered) |
| `bypass_consecutive_check` | `boolean` | No | Bypasses consecutive over restrictions for the bowler if set to `true` |

**cURL Example**

```bash
curl -X PATCH http://localhost:3000/api/v1/sports/cricket/matches/1/bowler \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bowler_id": 5}'
```

---

### #55 · PATCH `/sports/cricket/matches/:id/innings/start`

Starts the second innings of the match by setting the initial batsmen and bowler.

| | |
|---|---|
| **Method** | `PATCH` |
| **Path** | `/api/v1/sports/cricket/matches/:id/innings/start` |
| **Access** | 🔴 Protected *(Assigned Scorer only)* |
| **Status** | ✅ Live |

**Headers**

```
Content-Type: application/json
Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>
```

**Request Body (`StartSecondInningsDto`)**

| Field | Type | Required | Description |
|---|---|---|---|
| `opening_striker_id` | `number` | No | ID of the opening striker batsman |
| `opening_striker_guest_name` | `string` | No | Guest name of the opening striker |
| `opening_non_striker_id` | `number` | No | ID of the opening non-striker batsman |
| `opening_non_striker_guest_name` | `string` | No | Guest name of the opening non-striker |
| `opening_bowler_id` | `number` | No | ID of the opening bowler |
| `opening_bowler_guest_name` | `string` | No | Guest name of the opening bowler |

**cURL Example**

```bash
curl -X PATCH http://localhost:3000/api/v1/sports/cricket/matches/1/innings/start \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "opening_striker_id": 4,
    "opening_non_striker_id": 5,
    "opening_bowler_id": 1
  }'
```

---

### #56 · PATCH `/sports/cricket/matches/:id/balls/undo`

Undoes the single most recent delivery in the match, reverting score details, runs, wicket counts, overs, and strike rotation.

| | |
|---|---|
| **Method** | `PATCH` |
| **Path** | `/api/v1/sports/cricket/matches/:id/balls/undo` |
| **Access** | 🔴 Protected *(Assigned Scorer only)* |
| **Status** | ✅ Live |

**Headers**

```
Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>
```

**cURL Example**

```bash
curl -X PATCH http://localhost:3000/api/v1/sports/cricket/matches/1/balls/undo \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

---

### #56b · PATCH `/sports/cricket/matches/:id/strike/rotate`

Manually rotates/swaps the striker and non-striker currently active in the live match.

| | |
|---|---|
| **Method** | `PATCH` |
| **Path** | `/api/v1/sports/cricket/matches/:id/strike/rotate` |
| **Access** | 🔴 Protected *(Assigned Scorer only)* |
| **Status** | ✅ Live |

**Headers**

```
Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>
```

**cURL Example**

```bash
curl -X PATCH http://localhost:3000/api/v1/sports/cricket/matches/1/strike/rotate \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

---

### #57 · GET `/sports/cricket/matches/:id/live`

Retrieves a near real-time live view of the match scoring, batsman statistics, bowler statistics, and events in the current over.

| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/v1/sports/cricket/matches/:id/live` |
| **Access** | 🟢 Public |
| **Status** | ✅ Live |

**cURL Example**

```bash
curl -X GET http://localhost:3000/api/v1/sports/cricket/matches/1/live
```

**Response `200 OK`**

```json
{
  "success": true,
  "status": 200,
  "data": {
    "status": "live",
    "current_innings": 1,
    "score": "1/0",
    "overs": "0.1",
    "target": null,
    "current_run_rate": 6,
    "required_run_rate": null,
    "striker": {
      "id": 1,
      "name": "Ahmad Pabaini",
      "avatar_url": null,
      "runs": 1,
      "balls": 1
    },
    "non_striker": {
      "id": 3,
      "name": "Hamza Swabi",
      "avatar_url": null,
      "runs": 0,
      "balls": 0
    },
    "bowler": {
      "id": 4,
      "name": "Messi Khan",
      "avatar_url": null,
      "overs": "0.1",
      "runs_given": 1,
      "wickets": 0
    },
    "this_over": [
      {
        "runs": 1,
        "extra_type": null,
        "is_wicket": false
      }
    ],
    "balls_remaining_in_over": 5,
    "dismissed_players": [1]
  }
}
```

---

## 10. Sports Module — Phase 3 (Leaderboard & Standings) 🗓 Roadmap

These endpoints are planned for future Phase 3 development and are not yet implemented.

---

### #58 · GET `/sports/cricket/leaderboard`

Returns real-time standings and stats leaders.

| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/v1/sports/cricket/leaderboard` |
| **Access** | 🟢 Public |
| **Status** | 🗓 Planned |

---

### #59 · GET `/sports/cricket/stats/mvp`

Returns top players sorted by dynamically calculated MVP rating indexes.

| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/v1/sports/cricket/stats/mvp` |
| **Access** | 🟢 Public |
| **Status** | 🗓 Planned |

*© 2026 Pabaini Village Portal. Built with NestJS · PostgreSQL · Supabase · Firebase.*
