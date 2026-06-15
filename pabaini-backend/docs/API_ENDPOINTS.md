# Pabaini Backend API Reference Documentation

**Pabaini** is a community mobile application designed specifically for **Pabaini village** (Swabi District, Khyber Pakhtunkhwa, Pakistan). This portal replaces unstructured WhatsApp channels and Facebook posts with a dedicated platform for residents and diaspora members.

This document serves as a complete developer guide to the backend NestJS endpoints, database constraint schemas, and response envelopes.

---

## 🛠️ Table of Contents
1. [Base Configuration](#base-configuration)
2. [Authentication Module](#1-authentication-module)
   - [POST /auth/login](#1-user-authentication-login)
3. [Users Module](#2-users-module)
   - [GET /users/me](#2-get-my-profile)
   - [PATCH /users/me](#3-update-my-profile-details)
   - [POST /users/me/avatar](#4-upload-profile-picture-avatar)
   - [PATCH /users/:id/role](#5-update-user-role-admin-only)
   - [POST /users/device-token](#6-register-device-token)
   - [DELETE /users/device-token](#7-remove-device-token)
4. [Announcements Module](#3-announcements-module)
   - [GET /announcements](#8-get-all-announcements)
   - [GET /announcements/author/:authorId](#9-get-announcements-by-author)
   - [GET /announcements/:id](#10-get-single-announcement)
   - [POST /announcements](#11-create-announcement-adminmods)
   - [PATCH /announcements/:id](#12-update-announcement-authoradminmods)
   - [PATCH /announcements/:id/soft-delete](#13-soft-delete-announcement-authoradmin)
   - [DELETE /announcements/:id](#14-hard-delete-announcement-admin-only)
   - [POST /announcements/:id/like](#15-toggle-like-on-announcement)
   - [POST /announcements/:id/image](#16-upload-announcement-image-authoradminmods)

---

## Base Configuration

* **Base URL (Local)**: `http://localhost:3000`
* **Base URL (Android Emulator)**: `http://10.0.2.2:3000`
* **Global API Prefix**: `/api/v1`
* **Response Wrapper Envelope**: All responses return in a standard envelope shape:
  ```typescript
  interface ApiResponse<T> {
    success: boolean;
    status: number;
    message?: string;
    data: T;
  }
  ```

---

## 1. Authentication Module

### 1. User Authentication / Login
Used to register or sign in users using their Firebase ID Token. On first sign-in, it automatically initializes a PostgreSQL database record.

* **Method**: `POST`
* **Path**: `/api/v1/auth/login`
* **Access Control**: **Public** (No Auth Token needed)
* **Headers**:
  | Key | Value |
  |---|---|
  | `Content-Type` | `application/json` |

* **Request Body**:
  | Field | Type | Required | Description |
  |---|---|---|---|
  | `id_token` | `string` | **Yes** | Valid Firebase ID token returned from client sign-in |

* **cURL Example**:
  ```bash
  curl -X POST http://localhost:3000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"id_token": "YOUR_FIREBASE_ID_TOKEN"}'
  ```

* **Response (201 Created)**:
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

### 2. Get My Profile
Fetch profile settings and roles of the currently authenticated user.

* **Method**: `GET`
* **Path**: `/api/v1/users/me`
* **Access Control**: **Protected** (Requires Firebase ID Token)
* **Headers**:
  | Key | Value |
  |---|---|
  | `Authorization` | `Bearer <YOUR_FIREBASE_ID_TOKEN>` |

* **cURL Example**:
  ```bash
  curl -X GET http://localhost:3000/api/v1/users/me \
    -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
  ```

* **Response (200 OK)**:
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

### 3. Update My Profile Details
Updates fields on the user profile record. 

* **Method**: `PATCH`
* **Path**: `/api/v1/users/me`
* **Access Control**: **Protected** (Requires Firebase ID Token)
* **Headers**:
  | Key | Value |
  |---|---|
  | `Content-Type` | `application/json` |
  | `Authorization` | `Bearer <YOUR_FIREBASE_ID_TOKEN>` |

* **Request Body (All fields optional)**:
  | Field | Type | Description |
  |---|---|---|
  | `name` | `string` | Updated profile name (3-50 chars) |
  | `village` | `string` | Location name (defaults to "Pabaini") |
  | `is_diaspora` | `boolean` | Set to true if the member resides abroad |
  | `avatar_url` | `string` | Direct URL link to avatar image |

* **cURL Example**:
  ```bash
  curl -X PATCH http://localhost:3000/api/v1/users/me \
    -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name": "Ahmad Swabi", "is_diaspora": true}'
  ```

* **Response (200 OK)**:
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

### 4. Upload Profile Picture (Avatar)
Uploads image files directly to Supabase storage, mapping the file URL back to the active user profile.

* **Method**: `POST`
* **Path**: `/api/v1/users/me/avatar`
* **Access Control**: **Protected** (Requires Firebase ID Token)
* **Headers**:
  | Key | Value |
  |---|---|
  | `Authorization` | `Bearer <YOUR_FIREBASE_ID_TOKEN>` |

* **Request Body (multipart/form-data)**:
  | Field | Type | Required | Description |
  |---|---|---|---|
  | `avatar` | `file` | **Yes** | Image attachment (JPG, PNG, JPEG) |

* **cURL Example**:
  ```bash
  curl -X POST http://localhost:3000/api/v1/users/me/avatar \
    -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
    -F "avatar=@/path/to/profile.png"
  ```

---

### 5. Update User Role (Admin-Only)
Restricted route allowing administrators to elevate standard resident profiles.

> [!WARNING]
> Only accounts with the `admin` role can access this endpoint. Moderators cannot update roles.

* **Method**: `PATCH`
* **Path**: `/api/v1/users/:id/role`
* **Access Control**: **Admin-Only** (Requires Firebase ID Token + Admin Role Guard)
* **Headers**:
  | Key | Value |
  |---|---|
  | `Content-Type` | `application/json` |
  | `Authorization` | `Bearer <YOUR_FIREBASE_ID_TOKEN>` |

* **Request Body**:
  | Field | Type | Required | Description |
  |---|---|---|---|
  | `role` | `string` | **Yes** | Target role assignment (`resident`, `moderator`, `admin`) |

* **cURL Example**:
  ```bash
  curl -X PATCH http://localhost:3000/api/v1/users/2/role \
    -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"role": "moderator"}'
  ```

---

### 6. Register Device Token
Saves FCM device tokens to target notification delivery groups.

* **Method**: `POST`
* **Path**: `/api/v1/users/device-token`
* **Access Control**: **Protected** (Requires Firebase ID Token)
* **Headers**:
  | Key | Value |
  |---|---|
  | `Content-Type` | `application/json` |
  | `Authorization` | `Bearer <YOUR_FIREBASE_ID_TOKEN>` |

* **Request Body**:
  | Field | Type | Required | Description |
  |---|---|---|---|
  | `token` | `string` | **Yes** | Unique FCM registration token generated by device |

* **cURL Example**:
  ```bash
  curl -X POST http://localhost:3000/api/v1/users/device-token \
    -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"token": "FCM_DEVICE_TOKEN_HERE"}'
  ```

---

### 7. Remove Device Token
Deletes FCM device tokens from records on sign-out to prevent incorrect delivery.

* **Method**: `DELETE`
* **Path**: `/api/v1/users/device-token`
* **Access Control**: **Protected** (Requires Firebase ID Token)
* **Headers**:
  | Key | Value |
  |---|---|
  | `Content-Type` | `application/json` |
  | `Authorization` | `Bearer <YOUR_FIREBASE_ID_TOKEN>` |

* **Request Body**:
  | Field | Type | Required | Description |
  |---|---|---|---|
  | `token` | `string` | **Yes** | FCM registration token to remove |

* **cURL Example**:
  ```bash
  curl -X DELETE http://localhost:3000/api/v1/users/device-token \
    -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"token": "FCM_DEVICE_TOKEN_HERE"}'
  ```

---

## 3. Announcements Module

### 8. Get All Announcements
Fetches notices feed. Supports sorting by pinned indicators and publication dates.

* **Method**: `GET`
* **Path**: `/api/v1/announcements`
* **Access Control**: **Public** (Optional auth token binds individual `liked_by_me` state values)
* **Query Parameters**:
  | Field | Type | Default | Description |
  |---|---|---|---|
  | `page` | `number` | `1` | Pagination offset index |
  | `limit` | `number` | `10` | Total records per query page |
  | `category` | `string` | - | Category selection: `general`, `urgent`, `event`, `jirga_decision` |

* **cURL Example**:
  ```bash
  curl -X GET "http://localhost:3000/api/v1/announcements?page=1&limit=10&category=urgent"
  ```

* **Response (200 OK)**:
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

### 9. Get Announcements by Author
Queries lists of notices created by a specific user.

* **Method**: `GET`
* **Path**: `/api/v1/announcements/author/:authorId`
* **Access Control**: **Public** (Optional authorization)

---

### 10. Get Single Announcement
Fetch details of a single notice by database ID.

* **Method**: `GET`
* **Path**: `/api/v1/announcements/:id`
* **Access Control**: **Public** (Optional authorization)

---

### 11. Create Announcement (Admin/Mods)
Creates new announcement data in PostgreSQL database. 

> [!NOTE]
> Creating announcements requires either `admin` or `moderator` roles. Standard residents are restricted.

* **Method**: `POST`
* **Path**: `/api/v1/announcements`
* **Access Control**: **Protected** (Requires Firebase ID Token + Admin/Mod check)
* **Headers**:
  | Key | Value |
  |---|---|
  | `Content-Type` | `application/json` |
  | `Authorization` | `Bearer <YOUR_FIREBASE_ID_TOKEN>` |

* **Request Body**:
  | Field | Type | Required | Description |
  |---|---|---|---|
  | `title` | `string` | **Yes** | Notice title (3-100 chars) |
  | `content` | `string` | **Yes** | Announcement description (10-500 chars) |
  | `category` | `string` | **Yes** | Selection: `general`, `urgent`, `event`, `jirga_decision` |
  | `location` | `string` | No | Nullable landmark information text |
  | `image_url` | `string` | No | Direct image storage url reference |

* **cURL Example**:
  ```bash
  curl -X POST http://localhost:3000/api/v1/announcements \
    -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"title": "Jirga Assembly", "content": "Community meeting scheduled at Hujra.", "category": "jirga_decision", "location": "Pabaini Hujra"}'
  ```

---

### 12. Update Announcement (Author/Admin/Mods)
Updates notice records. Gatekept by ownership or admin/moderator roles.

* **Method**: `PATCH`
* **Path**: `/api/v1/announcements/:id`
* **Access Control**: **Protected** (Requires Firebase ID Token + Ownership/Role verification check)
* **Request Body (All fields optional)**:
  `title`, `content`, `category`, `location`, `image_url`, `is_pinned`.

---

### 13. Soft-Delete Announcement (Author/Admin)
Marks announcement records as soft-deleted in the database (`is_deleted = true`). 

> [!IMPORTANT]
> **Access Rules Exception**: Only the **Author** of the announcement or a user with the **Admin** role can delete notices. Moderators are restricted from soft-deleting other people's posts.
> 
> **Image Assets**: Attaching media is preserved in Supabase storage to support administrative audit recovery.

* **Method**: `PATCH`
* **Path**: `/api/v1/announcements/:id/soft-delete`
* **Access Control**: **Protected** (Requires Firebase ID Token + Author/Admin ownership check)
* **Headers**:
  | Key | Value |
  |---|---|
  | `Authorization` | `Bearer <YOUR_FIREBASE_ID_TOKEN>` |

* **cURL Example**:
  ```bash
  curl -X PATCH http://localhost:3000/api/v1/announcements/12/soft-delete \
    -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
  ```

---

### 14. Hard-Delete Announcement (Admin-Only)
Permanently deletes database record entries and cleans up attachments in the Supabase media bucket.

> [!WARNING]
> Executable strictly by users with the **Admin** role. Authors and moderators cannot call this endpoint.

* **Method**: `DELETE`
* **Path**: `/api/v1/announcements/:id`
* **Access Control**: **Admin-Only** (Requires Firebase ID Token + Admin check)
* **Headers**:
  | Key | Value |
  |---|---|
  | `Authorization` | `Bearer <YOUR_FIREBASE_ID_TOKEN>` |

* **cURL Example**:
  ```bash
  curl -X DELETE http://localhost:3000/api/v1/announcements/12 \
    -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
  ```

---

### 15. Toggle Like on Announcement
Authenticated residents can toggle announcement likes. Backed by transactional entities to avoid race conditions.

* **Method**: `POST`
* **Path**: `/api/v1/announcements/:id/like`
* **Access Control**: **Protected** (Requires Firebase ID Token)
* **Headers**:
  | Key | Value |
  |---|---|
  | `Authorization` | `Bearer <YOUR_FIREBASE_ID_TOKEN>` |

* **cURL Example**:
  ```bash
  curl -X POST http://localhost:3000/api/v1/announcements/12/like \
    -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
  ```

---

### 16. Upload Announcement Image (Author/Admin/Mods)
Uploads an image file to Supabase storage and maps the returned URL to the target announcement record.

* **Method**: `POST`
* **Path**: `/api/v1/announcements/:id/image`
* **Access Control**: **Protected** (Requires Firebase ID Token + Ownership/Role checks)
* **Headers**:
  | Key | Value |
  |---|---|
  | `Authorization` | `Bearer <YOUR_FIREBASE_ID_TOKEN>` |

* **Request Body (multipart/form-data)**:
  | Field | Type | Required | Description |
  |---|---|---|---|
  | `image` | `file` | **Yes** | Image file (PNG, JPG, JPEG) |

* **cURL Example**:
  ```bash
  curl -X POST http://localhost:3000/api/v1/announcements/12/image \
    -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
    -F "image=@/path/to/notice.jpg"
  ```
