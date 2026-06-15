# Pabaini Mobile - Push Notifications Documentation

This document describes the design and flow of the push notifications system, tracking both the current device token registration and the planned future implementation details.

---

## Device Token Flow (Already Implemented)

Device token registration manages how the unique Firebase Cloud Messaging (FCM) tokens are bound to active user accounts.

1. **On Login / Session Restore**:
   - The app invokes `messaging().requestPermission()` to request native notification authorization.
   - If granted, `messaging().getToken()` is called to fetch the unique registration token.
   - The token is sent to the backend via `POST /api/v1/users/device-token`.
2. **On Token Refresh**:
   - An active listener is initialized: `messaging().onTokenRefresh(newToken => registerDeviceToken(newToken))`.
   - If Firebase rotates or updates the FCM token, it automatically updates the PostgreSQL database record.
3. **On Logout**:
   - The current token is retrieved via `messaging().getToken()`.
   - The token is deleted from the backend via `DELETE /api/v1/users/device-token`.
   - Once backend confirmation succeeds, the Firebase session is signed out.

---

## Full Push Notification Flow (To Implement Later)

### PART 1 — Native Setup (TODO)
- **Install Package**: `@react-native-firebase/messaging` (Installed).
- **Configure Console**: Enable and link FCM inside the Firebase Console.
- **Client Configuration**: Integrate the downloaded `google-services.json` inside the mobile android app directories (Completed).
- **Foreground Handlers**: Implement `messaging().onMessage(async remoteMessage => { ... })` to catch incoming alerts when the user has the app open, rendering custom in-app banner notifications.
- **Background Handlers**: Wire up `messaging().setBackgroundMessageHandler(async remoteMessage => { ... })` in `index.js` (or app entry) to process payloads in the background.
- **Tap Redirect Handlers**: Listen for notification clicks using `messaging().onNotificationOpenedApp()` (while backgrounded) and `messaging().getInitialNotification()` (during cold-start launches).

### PART 2 — Backend Integration (TODO)
- **Token Query**: When an announcement flagged with an `urgent` or `jirga_decision` category is created, the NestJS backend queries all device tokens stored in the `users` table.
- **Payload Format**: The backend invokes the FCM API via the `firebase-admin` SDK with the payload:
  ```json
  {
    "notification": {
      "title": "Urgent Announcement Title",
      "body": "Announcement content summary..."
    },
    "data": {
      "announcementId": "12",
      "category": "urgent"
    }
  }
  ```
- **Redirection routing**: The client app intercepts the `announcementId` parameter from the notification payload and programmatically routes the user: `router.push('/announcement/12')`.

### PART 3 — Three Notification States
- **Foreground (App Open)**: The user is actively inside the app. Notification does not show in the OS tray. We handle it in `onMessage()` and display a custom modal or toast message.
- **Background (App Minimized)**: The app is running but minimized. The OS displays the notification in the tray. Tapping it wakes the app and calls `onNotificationOpenedApp()`.
- **Closed (App Terminated)**: The app is completely closed. The OS displays the notification. Tapping it cold-starts the app, and `getInitialNotification()` intercepts the payload to deep-link the user.

---

## Dependencies & Configuration (TODO)
- `@react-native-firebase/messaging` (Installed).
- **Deep Linking Scheme**: Set to `pabaini` inside `app.json` (Completed).
- **Navigation Handler**: Wired to route to `app/announcement/[id].tsx`.

---

## Engineering Guidelines & Notes
- **Category Restrictions**: Send notifications **only** for `urgent` and `jirga_decision` categories. General and event notices should not trigger push notifications to prevent spamming residents.
- **Database Cleanup**: When the backend calls FCM, if FCM responds with an invalid/expired token error (e.g. `messaging/registration-token-not-registered`), the backend service must catch this error and automatically delete the stale token from the database.
- **Batching**: Use batching APIs or multicast messages if target tokens scale beyond standard limits, minimizing connection overhead on the server.
