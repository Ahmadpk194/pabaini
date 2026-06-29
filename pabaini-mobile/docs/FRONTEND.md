# Pabaini Mobile - Frontend Features & Engineering Documentation

This document describes the design, implementation, and engineering flows of major frontend features in the Pabaini mobile application, including push notifications and comments.

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

---

## 💬 Comments V1 Feature Integration (Already Implemented)

The Comments V1 feature provides community discussion and feedback on announcements. Comments are polymorphic and designed to easily adapt to matches, teams, and players in future phases.

### Approach Choice: React Query Optimistic Updates

We choose **React Query (`useQuery` and `useMutation`)** cache manipulation for handling comment states, rather than custom Zustand or local React state array trackers. 

#### Full Flow Lifecycle:
1. **Fetch & Render**: On screen load, `getComments` fetches the first page of comments. If empty, the user is presented with a prompt: *"No comments yet. Be the first to comment."*. Pull-to-refresh invalidates detail queries.
2. **Optimistic Creation**:
   - The user inputs text and taps Send.
   - The app immediately cancels active comments refetches using `queryClient.cancelQueries`.
   - It captures a snapshot of the current comments cache (`queryClient.getQueryData`).
   - It instantiates a mock `Comment` payload containing a temporary timestamp-derived ID and `isPending: true`.
   - The comments cache is updated directly, rendering the comment immediately with **lower opacity (0.6)** and **no Edit/Delete triggers** (gated by `!comment.isPending`).
   - The request runs in the background. On success, it replaces the temporary comment with the server response. On error, it rolls back to the snapshotted cache and raises an alert.
3. **Inline Edit**:
   - Authorized users see an "Edit" button next to their comment's timestamp.
   - Tapping it loads the text back into the text input, focus is requested, and a custom header displays "Editing comment" with a "Cancel" button.
   - Tapping send fires the `PATCH` API and resets input states on success.
4. **Soft Delete**:
   - The user taps "Delete". A native confirmation dialog `Alert.alert` is displayed.
   - If confirmed, the API runs, the item is removed from the local lists, and count badges update.

#### Pros and Cons:

| **Pros** | **Cons** |
|---|---|
| **Zero Latency**: UI updates immediately after sending, providing a snappy experience. | **Mock Overhead**: Requires generating dummy date/ID objects in the client logic. |
| **Robust Error Recovery**: Handles automatic rollbacks, eliminating stale loading states. | **Code Complexity**: Demands strict handler synchronization during cache overrides. |
| **Atomic Cache Sync**: Keeps notice feed stats and details page comments counts synced. | |

---

## 🔍 Global Search Screen Feature Integration (Wired to Backend)

Global search unifies discoverability across Pabaini's modules (Announcements, Users, Matches, Players, Teams).

### Approach Choice: TanStack Query Infinite Queries

We use **TanStack Query (`useInfiniteQuery` v5)** to query the backend database for list pages. This approach automatically coordinates offset skip values and retains local result caching when switching between tabs.

#### Full Flow Lifecycle:

1. **Keypress Debouncing (300ms)**:
   - Typing triggers a `300ms` self-healing `setTimeout` lock.
   - If the user keeps typing, the pending request is cancelled.
   - This prevents intermediate keystrokes from spamming the backend.
2. **Minimum Length Threshold**:
   - Search triggers only when query length is **2 or more characters**.
   - Single-character inputs render a *"Keep typing..."* reminder.
3. **Query Log Persistence (AsyncStorage)**:
   - Successful queries are appended to the front of a history log array (max 8 entries) and written to the `pabaini_recent_searches` key.
   - Tapping an item populates the input and executes search instantly.
4. **Infinite Scroll Pagination**:
   - FlatList `onEndReached` callback is triggered at a `0.3` threshold.
   - It calls React Query's `fetchNextPage` wrapper.
   - Extends the local query cache atomically, appending new pages without full-list refetches.
5. **Parallel Category Aggregation ("All" category)**:
   - Activating the **All** pill runs 4 parallel search requests concurrently.
   - Shows a sectioned preview overview (max 3 items per category).
   - Zero-result sections are hidden, and tapping *"See all"* switches tabs.

#### Pros and Cons:

| **Pros** | **Cons** |
|---|---|
| **Performance**: Caches tab results for 30s (`staleTime: 30_000`), reducing redundant network payload roundtrips. | **Concurrent Queries Overhead**: The "All" tab runs 4 queries concurrently, increasing server request volume. |
| **UX Shimmer Layouts**: Reuses native card skeletons matching card heights instead of standard indicators. | **State Complexity**: Manages two inputs (live `inputValue` and debounced `searchQuery`) to prevent stuttering. |
| **Extensible Architecture**: Adding tabs requires only a config entry in `SEARCH_CATEGORIES`. | |
