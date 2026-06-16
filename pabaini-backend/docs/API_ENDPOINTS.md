# Pabaini Backend — API Reference

> **Pabaini** is a community mobile app for Pabaini village (Swabi District, KPK, Pakistan). This document is the complete developer reference for all NestJS backend REST API endpoints, organized by module and phase.

---

## Quick Reference

| Module | Endpoints | Status |
|---|---|---|
| Authentication | 1 | ✅ Live |
| Users | 6 | ✅ Live |
| Announcements | 9 | ✅ Live |
| Sports — Phase 1 (Cricket Profiles) | 5 | ✅ Live |
| Sports — Phase 2 (Cricket Teams) | 14 | ✅ Live |
| Notifications Module | 4 | ✅ Live |
| Sports — Phase 3 (Matches & Standings) | 6 | 🗓 Roadmap |
| **Total** | **45** | |

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

### 3. Announcements Module
- [#8 — GET `/announcements`](#8-get-announcements) — Get all announcements
- [#9 — GET `/announcements/author/:authorId`](#9-get-announcementsauthorauthorid) — By author
- [#10 — GET `/announcements/:id`](#10-get-announcementsid) — Single announcement
- [#11 — POST `/announcements`](#11-post-announcements) — Create *(Admin/Mod)*
- [#12 — PATCH `/announcements/:id`](#12-patch-announcementsid) — Update *(Author/Admin/Mod)*
- [#13 — PATCH `/announcements/:id/soft-delete`](#13-patch-announcementsidsoft-delete) — Soft-delete *(Author/Admin)*
- [#14 — DELETE `/announcements/:id`](#14-delete-announcementsid) — Hard-delete *(Admin only)*
- [#15 — POST `/announcements/:id/like`](#15-post-announcementsidlike) — Toggle like
- [#16 — POST `/announcements/:id/image`](#16-post-announcementsidimage) — Upload image

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

### 7. Sports Module — Phase 3 🗓 Roadmap
- [#40 — POST `/sports/cricket/matches`](#40-post-sportscricketmatches) — Schedule match
- [#41 — GET `/sports/cricket/matches`](#41-get-sportscricketmatches) — List matches
- [#42 — GET `/sports/cricket/matches/:id`](#42-get-sportscricketmatchesid) — Get match details
- [#43 — PATCH `/sports/cricket/matches/:id/scores`](#43-patch-sportscricketmatchesidscores) — Record scores
- [#44 — GET `/sports/cricket/leaderboard`](#44-get-sportscricketleaderboard) — Leaderboard standings
- [#45 — GET `/sports/cricket/stats/mvp`](#45-get-sportscricketstatsmvp) — MVP rankings

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
| `category` | `string` | — | Filter: `general` · `urgent` · `event` · `jirga_decision` |

**cURL Example**

```bash
curl -X GET "http://localhost:3000/api/v1/announcements?page=1&limit=10&category=urgent"
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

Creates a new announcement. Restricted to `admin` and `moderator` roles.

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/v1/announcements` |
| **Access** | 🔴 Protected *(Admin / Mod)* |

> [!NOTE]
> Standard residents cannot create announcements. Requires `admin` or `moderator` role.

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
| `category` | `string` | ✅ Yes | `general` · `urgent` · `event` · `jirga_decision` |
| `location` | `string` | No | Optional landmark or place name |
| `image_url` | `string` | No | Direct URL to an uploaded image |

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

---

### #23 · GET `/sports/cricket/teams`

Lists all active cricket teams.

| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/v1/sports/cricket/teams` |
| **Access** | 🟢 Public |

**cURL Example**

```bash
curl -X GET http://localhost:3000/api/v1/sports/cricket/teams
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
      "member_count": 8
    }
  ]
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
    actor Player as Player / Captain
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

### Sports — Phase 3 🗓 Roadmap

> These endpoints are **planned** for Phase 3 development. They are not yet implemented.

---

### #40 · POST `/sports/cricket/matches`

Schedules a tournament match between two registered teams.

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/v1/sports/cricket/matches` |
| **Access** | 🔴 Protected *(Admin / Organizer)* |
| **Status** | 🗓 Planned — Phase 3 |

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `team_a_id` | `number` | ✅ Yes | ID of team A |
| `team_b_id` | `number` | ✅ Yes | ID of team B |
| `scheduled_at` | `string` | ✅ Yes | ISO-8601 timestamp |
| `overs` | `number` | ✅ Yes | Total overs per innings |
| `location` | `string` | ✅ Yes | Ground name or location |

---

### #41 · GET `/sports/cricket/matches`

Lists all matches with optional filters for status (completed/live/upcoming).

| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/v1/sports/cricket/matches` |
| **Access** | 🟢 Public |
| **Status** | 🗓 Planned — Phase 3 |

---

### #42 · GET `/sports/cricket/matches/:id`

Retrieves detailed match details, scorecards, and MVP metrics.

| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/v1/sports/cricket/matches/:id` |
| **Access** | 🟢 Public |
| **Status** | 🗓 Planned — Phase 3 |

---

### #43 · PATCH `/sports/cricket/matches/:id/scores`

Records or updates live scores, overs played, and match result for a scheduled match.

| | |
|---|---|
| **Method** | `PATCH` |
| **Path** | `/api/v1/sports/cricket/matches/:id/scores` |
| **Access** | 🔴 Protected *(Designated Scorer / Admin)* |
| **Status** | 🗓 Planned — Phase 3 |

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `runs_team_a` | `number` | No | Runs scored by Team A |
| `wickets_team_a` | `number` | No | Wickets lost by Team A |
| `overs_team_a` | `number` | No | Overs played by Team A |
| `runs_team_b` | `number` | No | Runs scored by Team B |
| `wickets_team_b` | `number` | No | Wickets lost by Team B |
| `overs_team_b` | `number` | No | Overs played by Team B |
| `status` | `string` | ✅ Yes | `live` or `completed` |
| `winner_team_id` | `number` | No | ID of the winning team |
| `man_of_the_match_profile_id` | `number` | No | Profile ID of Man of the Match |

---

### #44 · GET `/sports/cricket/leaderboard`

Returns real-time tournament standings, top run-scorers, wicket leaders, and MVP index.

| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/v1/sports/cricket/leaderboard` |
| **Access** | 🟢 Public |
| **Status** | 🗓 Planned — Phase 3 |

---

### #45 · GET `/sports/cricket/stats/mvp`

Returns top players sorted by dynamically calculated MVP rating indexes.

| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/v1/sports/cricket/stats/mvp` |
| **Access** | 🟢 Public |
| **Status** | 🗓 Planned — Phase 3 |

---

*© 2026 Pabaini Village Portal. Built with NestJS · PostgreSQL · Supabase · Firebase.*
