# Pabaini — Project Overview

**Pabaini** is a community mobile app for **Pabaini village** (Swabi District, Khyber Pakhtunkhwa, Pakistan), built to replace scattered WhatsApp groups and Facebook posts with a single, organized platform for all ~25,000 residents and diaspora members.

### Core Features (Phase 1)
- **Auth & Users** — Firebase login (Phone OTP / Google), auto-registration on first sign-in, profile management
- **Announcements** — Centralized notice board (General, Urgent, Event, Jirga Decision) with likes and WhatsApp sharing
- **Sports** — Cricket tournament management, team squads, match schedules, and player leaderboards

### Tech Stack
| Layer | Technology |
|---|---|
| Mobile | React Native + Expo |
| Backend | NestJS + TypeORM |
| Database | Supabase (PostgreSQL) |
| File Storage | Supabase Storage |
| Auth | Firebase Auth (Phone OTP + Google Sign-In) |

### Auth Flow
Firebase handles all login/registration. On first login, the backend verifies the Firebase ID token and auto-creates a user record. **The Firebase ID token is used as the Bearer token for all protected API requests** — no separate JWT is issued by the backend.

---

# Pabaini Backend API Documentation

**Total Endpoints:** 16
* **Auth Module Endpoints:** 1
* **Users Module Endpoints:** 6
* **Announcements Module Endpoints:** 9

---

## Base Configuration
* **Base URL:** `http://localhost:3000`
* **Prefix:** `/api/v1`

---

## Auth Module (1 Endpoint)

### 1. User Authentication / Login
Used to authenticate users and dynamically register them on their first sign-in.

* **Method:** `POST`
* **Path:** `/api/v1/auth/login`
* **Auth Guard:** **Public** (No token needed)
* **Headers:** 
  * `Content-Type: application/json`
* **Request Body:**
```json
{
  "id_token": "YOUR_FIREBASE_ID_TOKEN"
}
```
* **Response:**
```json
{
  "success": true,
  "status": 201,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "firebase_uid": "C0Np3cHX2ugOWNzenBka4O8zokt1",
      "phone": null,
      "email": "user@gmail.com",
      "name": "User Name",
      "avatar_url": "https://...",
      "village": null,
      "is_diaspora": false,
      "role": "resident",
      "created_at": "2026-06-12T01:10:00.000Z",
      "updated_at": "2026-06-12T01:10:00.000Z"
    }
  }
}
```

---

## Users Module (6 Endpoints)

### 2. Get My Profile
Used on frontend load/refresh to fetch the user's database settings (role, village, etc.).

* **Method:** `GET`
* **Path:** `/api/v1/users/me`
* **Auth Guard:** **Protected** (Requires Firebase ID Token)
* **Headers:** 
  * `Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>`
* **Request Body:** None
* **Response:**
```json
{
  "success": true,
  "status": 200,
  "message": "Profile retrieved successfully",
  "data": {
    "id": 1,
    "firebase_uid": "C0Np3cHX2ugOWNzenBka4O8zokt1",
    "phone": null,
    "email": "user@gmail.com",
    "name": "User Name",
    "avatar_url": "https://...",
    "village": null,
    "is_diaspora": false,
    "role": "resident",
    "created_at": "2026-06-12T01:10:00.000Z",
    "updated_at": "2026-06-12T01:10:00.000Z"
  }
}
```

---

### 3. Update My Profile Details
Used on the complete profile screen or settings page to update user profile information.

* **Method:** `PATCH`
* **Path:** `/api/v1/users/me`
* **Auth Guard:** **Protected** (Requires Firebase ID Token)
* **Headers:** 
  * `Content-Type: application/json`
  * `Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>`
* **Request Body (All fields are optional):**
```json
{
  "name": "Updated Name",
  "village": "Pabaini",
  "is_diaspora": true,
  "avatar_url": "https://..."
}
```
* **Response:**
```json
{
  "success": true,
  "status": 200,
  "message": "Profile updated successfully",
  "data": {
    "id": 1,
    "firebase_uid": "C0Np3cHX2ugOWNzenBka4O8zokt1",
    "phone": null,
    "email": "user@gmail.com",
    "name": "Updated Name",
    "avatar_url": "https://...",
    "village": "Pabaini",
    "is_diaspora": true,
    "role": "resident",
    "created_at": "2026-06-12T01:10:00.000Z",
    "updated_at": "2026-06-12T01:20:00.000Z"
  }
}
```

---

### 4. Upload Profile Picture (Avatar)
Used to upload a local image file directly to Supabase Storage and automatically save the URL to the user's database profile.

* **Method:** `POST`
* **Path:** `/api/v1/users/me/avatar`
* **Auth Guard:** **Protected** (Requires Firebase ID Token)
* **Headers:** 
  * `Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>`
* **Request Body (multipart/form-data):**
  * **Key:** `avatar` (Type: **File**)
  * **Value:** *(Select image file)*
* **Response:**
```json
{
  "success": true,
  "status": 201,
  "message": "Avatar uploaded successfully",
  "data": {
    "id": 1,
    "firebase_uid": "C0Np3cHX2ugOWNzenBka4O8zokt1",
    "phone": null,
    "email": "user@gmail.com",
    "name": "User Name",
    "avatar_url": "https://ntsscybmwyirhoidflqs.supabase.co/storage/v1/object/public/pabaini-media/avatars/C0Np3cHX2ugOWNzenBka4O8zokt1-1781211297762.JPG",
    "village": "Pabaini",
    "is_diaspora": true,
    "role": "resident",
    "created_at": "2026-06-12T01:10:00.000Z",
    "updated_at": "2026-06-12T01:30:00.000Z"
  }
}
```

---

### 5. Update User Role
Used by admins to assign or update a user's role. Only admins can access this endpoint.

* **Method:** `PATCH`
* **Path:** `/api/v1/users/:id/role`
* **Auth Guard:** **Protected** (Requires Firebase ID Token + Admin Role)
* **Headers:** 
  * `Content-Type: application/json`
  * `Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>`
* **Request Body:**
```json
{
  "role": "moderator"
}
```
* **Response:**
```json
{
  "success": true,
  "status": 200,
  "message": "User role updated successfully",
  "data": {
    "id": 1,
    "firebase_uid": "C0Np3cHX2ugOWNzenBka4O8zokt1",
    "phone": null,
    "email": "user@gmail.com",
    "name": "User Name",
    "avatar_url": "https://...",
    "village": "Pabaini",
    "is_diaspora": true,
    "role": "moderator",
    "created_at": "2026-06-12T01:10:00.000Z",
    "updated_at": "2026-06-12T01:30:00.000Z"
  }
}
```

---

### 6. Register Device Token
Used to register a device token for push notifications. This should be called when the app first launches or when the token changes.

* **Method:** `POST`
* **Path:** `/api/v1/users/device-token`
* **Auth Guard:** **Protected** (Requires Firebase ID Token)
* **Headers:**
  * `Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>`
* **Request Body:**
```json
{
  "token": "your_fcm_device_token"
}
```
* **Response:**
```json
{
  "success": true,
  "status": 200,
  "message": "Device token registered successfully",
  "data": {
    "success": true
  }
}
```

---

### 7. Remove Device Token
Used to remove a device token when the user logs out or uninstalls the app.

* **Method:** `DELETE`
* **Path:** `/api/v1/users/device-token`
* **Auth Guard:** **Protected** (Requires Firebase ID Token)
* **Headers:**
  * `Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>`
* **Request Body:**
```json
{
  "token": "your_fcm_device_token"
}
```
* **Response:**
```json
{
  "success": true,
  "status": 200,
  "message": "Device token removed successfully",
  "data": {
    "success": true
  }
}
```

---

## Announcements Module (8 Endpoints)

### 6. Get All Announcements
Used to fetch all announcements ordered by newest first with pagination and optional category filtering.

* **Method:** `GET`
* **Path:** `/api/v1/announcements`
* **Auth Guard:** **Public** (No token needed, but if authenticated, returns `liked_by_me` field)
* **Headers:** None
* **Query Parameters:**
  * `page` (optional): Page number (default: 1)
  * `limit` (optional): Items per page (default: 10)
  * `category` (optional): Filter by category (values: `general`, `urgent`, `event`, `jirga_decision`)
* **Request Body:** None
* **Response:**
```json
{
  "success": true,
  "status": 200,
  "message": "Announcements retrieved successfully",
  "data": [
    {
      "id": 1,
      "title": "Village Meeting",
      "content": "Please attend the village meeting tomorrow at 10 AM",
      "category": "urgent",
      "image_url": null,
      "likes_count": 5,
      "liked_by_me": true,
      "is_pinned": false,
      "author_id": 1,
      "author": {
        "id": 1,
        "name": "Admin User",
        "avatar_url": "https://..."
      },
      "created_at": "2026-06-12T01:10:00.000Z",
      "updated_at": "2026-06-12T01:10:00.000Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

### 6. Get Announcements by Author
Used to fetch all announcements created by a specific user.

* **Method:** `GET`
* **Path:** `/api/v1/announcements/author/:authorId`
* **Auth Guard:** **Public** (No token needed, but if authenticated, returns `liked_by_me` field)
* **Headers:** None
* **Request Body:** None
* **Response:**
```json
{
  "success": true,
  "status": 200,
  "message": "Announcements retrieved successfully",
  "data": [
    {
      "id": 1,
      "title": "Village Meeting",
      "content": "Please attend the village meeting tomorrow at 10 AM",
      "category": "urgent",
      "image_url": null,
      "likes_count": 5,
      "liked_by_me": false,
      "is_pinned": false,
      "author_id": 1,
      "author": {
        "id": 1,
        "name": "Admin User",
        "avatar_url": "https://..."
      },
      "created_at": "2026-06-12T01:10:00.000Z",
      "updated_at": "2026-06-12T01:10:00.000Z"
    }
  ]
}
```

---

### 7. Get Single Announcement
Used to fetch a single announcement by ID.

* **Method:** `GET`
* **Path:** `/api/v1/announcements/:id`
* **Auth Guard:** **Public** (No token needed, but if authenticated, returns `liked_by_me` field)
* **Headers:** None
* **Request Body:** None
* **Response:**
```json
{
  "success": true,
  "status": 200,
  "message": "Announcement retrieved successfully",
  "data": {
    "id": 1,
    "title": "Village Meeting",
    "content": "Please attend the village meeting tomorrow at 10 AM",
    "category": "urgent",
    "image_url": null,
    "likes_count": 5,
    "liked_by_me": true,
    "is_pinned": false,
    "author_id": 1,
    "author": {
      "id": 1,
      "name": "Admin User",
      "avatar_url": "https://..."
    },
    "created_at": "2026-06-12T01:10:00.000Z",
    "updated_at": "2026-06-12T01:10:00.000Z"
  }
}
```

---

### 8. Create Announcement
Used to create a new announcement. Only admins and moderators can create announcements.

* **Method:** `POST`
* **Path:** `/api/v1/announcements`
* **Auth Guard:** **Protected** (Requires Firebase ID Token)
* **Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>`
* **Request Body:**
```json
{
  "title": "Village Meeting",
  "content": "Please attend the village meeting tomorrow at 10 AM",
  "category": "urgent",
  "image_url": "https://..."
}
```
* **Response:**
```json
{
  "success": true,
  "status": 201,
  "data": {
    "id": 1,
    "title": "Village Meeting",
    "content": "Please attend the village meeting tomorrow at 10 AM",
    "category": "urgent",
    "image_url": "https://...",
    "likes_count": 0,
    "is_pinned": false,
    "author_id": 1,
    "author": {
      "id": 1,
      "name": "Admin User",
      "avatar_url": "https://..."
    },
    "created_at": "2026-06-12T01:10:00.000Z",
    "updated_at": "2026-06-12T01:10:00.000Z"
  }
}
```

---

### 9. Update Announcement
Used to update an existing announcement. Only the author or admins/moderators can update.

* **Method:** `PATCH`
* **Path:** `/api/v1/announcements/:id`
* **Auth Guard:** **Protected** (Requires Firebase ID Token)
* **Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>`
* **Request Body (All fields are optional):**
```json
{
  "title": "Updated Title",
  "content": "Updated content",
  "category": "general",
  "image_url": "https://..."
}
```
* **Response:**
```json
{
  "success": true,
  "status": 200,
  "data": {
    "id": 1,
    "title": "Updated Title",
    "content": "Updated content",
    "category": "general",
    "image_url": "https://...",
    "likes_count": 5,
    "is_pinned": false,
    "author_id": 1,
    "author": {
      "id": 1,
      "name": "Admin User",
      "avatar_url": "https://..."
    },
    "created_at": "2026-06-12T01:10:00.000Z",
    "updated_at": "2026-06-12T01:20:00.000Z"
  }
}
```

---

### 10. Soft Delete Announcement
Used to soft delete an announcement. Only the author or admins/moderators can delete. This is a soft delete - the announcement is marked as deleted but remains in the database for audit purposes. The image is NOT deleted to allow for recovery.

* **Method:** `PATCH`
* **Path:** `/api/v1/announcements/:id/soft-delete`
* **Auth Guard:** **Protected** (Requires Firebase ID Token)
* **Headers:**
  * `Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>`
* **Request Body:** None
* **Response:**
```json
{
  "success": true,
  "status": 200,
  "data": null
}
```

---

### 11. Hard Delete Announcement
Used to permanently delete an announcement. Only admins can hard delete. This permanently removes the announcement from the database and deletes its image from Supabase Storage.

* **Method:** `DELETE`
* **Path:** `/api/v1/announcements/:id`
* **Auth Guard:** **Protected** (Requires Firebase ID Token + Admin Role)
* **Headers:**
  * `Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>`
* **Request Body:** None
* **Response:**
```json
{
  "success": true,
  "status": 200,
  "message": "Announcement permanently deleted",
  "data": null
}
```

---

### 12. Toggle Like on Announcement
Used to like or unlike an announcement. Authenticated users can toggle likes.

* **Method:** `POST`
* **Path:** `/api/v1/announcements/:id/like`
* **Auth Guard:** **Protected** (Requires Firebase ID Token)
* **Headers:**
  * `Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>`
* **Request Body:** None
* **Response:**
```json
{
  "success": true,
  "status": 200,
  "data": {
    "id": 1,
    "title": "Village Meeting",
    "content": "Please attend the village meeting tomorrow at 10 AM",
    "category": "urgent",
    "image_url": null,
    "likes_count": 6,
    "is_pinned": false,
    "author_id": 1,
    "author": {
      "id": 1,
      "name": "Admin User",
      "avatar_url": "https://..."
    },
    "created_at": "2026-06-12T01:10:00.000Z",
    "updated_at": "2026-06-12T01:10:00.000Z"
  }
}
```

---

### 12. Upload Announcement Image
Used to upload an image for an announcement. Only the author or admins/moderators can upload images.

* **Method:** `POST`
* **Path:** `/api/v1/announcements/:id/image`
* **Auth Guard:** **Protected** (Requires Firebase ID Token)
* **Headers:**
  * `Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>`
* **Request Body (multipart/form-data):**
  * **Key:** `image` (Type: **File**)
  * **Value:** *(Select image file)*
* **Response:**
```json
{
  "success": true,
  "status": 200,
  "message": "Announcement image uploaded successfully",
  "data": {
    "id": 1,
    "title": "Village Meeting",
    "content": "Please attend the village meeting tomorrow at 10 AM",
    "category": "urgent",
    "image_url": "https://ntsscybmwyirhoidflqs.supabase.co/storage/v1/object/public/pabaini-media/announcements/announcement-1-1781211602778.JPG",
    "likes_count": 5,
    "liked_by_me": false,
    "is_pinned": false,
    "author_id": 1,
    "author": {
      "id": 1,
      "name": "Admin User",
      "avatar_url": "https://..."
    },
    "created_at": "2026-06-12T01:10:00.000Z",
    "updated_at": "2026-06-12T01:30:00.000Z"
  }
}
```

---
