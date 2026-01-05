# Notifications API - Implementation Guide

## 📋 Overview

A complete notification system has been implemented with backend APIs and frontend integration. Notifications are automatically created for various events like case assignments, task assignments, upcoming hearings, etc.

## 🗄️ Database Model

**Location**: `server/models/Notification.js`

### Fields:
- `userId` - User who receives the notification
- `type` - Notification type (case_assigned, task_assigned, etc.)
- `title` - Notification title
- `message` - Notification message
- `link` - Optional link to related resource
- `isRead` - Read/unread status
- `readAt` - Timestamp when marked as read
- `metadata` - Additional data (caseId, taskId, etc.)

## 🔌 API Endpoints

### Base URL: `/api/notifications`

#### 1. Get All Notifications
```
GET /api/notifications
Query Params:
  - limit: Number of notifications (default: 50)
  - skip: Number to skip (default: 0)
  - unreadOnly: true/false (default: false)

Response:
{
  notifications: [...],
  unreadCount: 5,
  total: 10
}
```

#### 2. Get Unread Count
```
GET /api/notifications/unread-count

Response:
{
  unreadCount: 5
}
```

#### 3. Mark Notification as Read
```
PATCH /api/notifications/:id/read

Response:
{
  message: "Notification marked as read",
  notification: {...}
}
```

#### 4. Mark All as Read
```
PATCH /api/notifications/mark-all-read

Response:
{
  message: "All notifications marked as read",
  updatedCount: 10
}
```

#### 5. Delete Notification
```
DELETE /api/notifications/:id

Response:
{
  message: "Notification deleted successfully"
}
```

#### 6. Create Notification (Admin or System)
```
POST /api/notifications
Body:
{
  userId: "user_id", // Optional, defaults to current user
  type: "case_assigned",
  title: "New Case Assigned",
  message: "You have been assigned to case...",
  link: "/cases/123",
  metadata: { caseId: "123" }
}
```

## 🎯 Automatic Notifications

Notifications are automatically created for the following events:

### 1. Case Assignment
**When**: Admin assigns a case to an employee
**Location**: `server/routes/cases.js` - PUT `/api/cases/:id/assign`
**Function**: `notifyCaseAssigned()`

### 2. Task Assignment
**When**: Admin creates and assigns a task
**Location**: `server/routes/workAssignments.js` - POST `/api/work-assignments`
**Function**: `notifyTaskAssigned()`

## 🔧 Utility Functions

**Location**: `server/utils/notifications.js`

Available functions:
- `createNotification()` - Create a custom notification
- `notifyCaseAssigned()` - Case assignment notification
- `notifyTaskAssigned()` - Task assignment notification
- `notifyTaskOverdue()` - Task overdue notification
- `notifyUpcomingHearing()` - Upcoming hearing reminder
- `notifyBillGenerated()` - Bill generation notification
- `notifyLateAttendance()` - Late attendance alert (for admin)
- `createSystemAnnouncement()` - Broadcast to multiple users

## 📱 Frontend Integration

**Location**: `client/src/components/Layout.js`

### Features:
- Real-time notification badge showing unread count
- Dropdown menu showing recent notifications
- Auto-refresh every 30 seconds
- Click notification to navigate to related page
- Mark as read on click
- Responsive design for mobile and desktop

### Usage in Components:
```javascript
// Fetch notifications
const response = await axios.get('/notifications?limit=10');
const { notifications, unreadCount } = response.data;

// Mark as read
await axios.patch(`/notifications/${id}/read`);

// Mark all as read
await axios.patch('/notifications/mark-all-read');
```

## 🔔 Notification Types

1. **case_assigned** - New case assigned to user
2. **case_updated** - Case details updated
3. **task_assigned** - New task assigned
4. **task_overdue** - Task past due date
5. **task_completed** - Task completed (can notify admin)
6. **hearing_upcoming** - Upcoming court hearing
7. **bill_generated** - New bill generated
8. **attendance_late** - Late check-in (admin notification)
9. **system_announcement** - System-wide announcement

## 📝 Adding New Notification Types

### Step 1: Add to Model
Add the new type to the enum in `server/models/Notification.js`:
```javascript
enum: [
  // ... existing types
  'your_new_type',
]
```

### Step 2: Create Utility Function
Add to `server/utils/notifications.js`:
```javascript
async function notifyYourEvent(userId, data) {
  return createNotification({
    userId,
    type: 'your_new_type',
    title: 'Your Title',
    message: `Your message: ${data.info}`,
    link: '/your-link',
    metadata: { dataId: data._id },
  });
}
```

### Step 3: Call in Route
In your route handler:
```javascript
const { notifyYourEvent } = require('../utils/notifications');

// ... in your route handler
await notifyYourEvent(userId, data);
```

## 🚀 Future Enhancements

- [ ] Email notifications
- [ ] Push notifications (browser/desktop)
- [ ] SMS notifications (for critical alerts)
- [ ] Notification preferences per user
- [ ] Notification grouping
- [ ] Rich notification content (images, actions)
- [ ] Real-time updates via WebSocket

## ✅ Testing

### Test Notification Creation:
```bash
# Login and get token
POST /api/auth/login

# Create notification
POST /api/notifications
Headers: Authorization: Bearer <token>
Body:
{
  "type": "system_announcement",
  "title": "Test Notification",
  "message": "This is a test notification"
}

# Get notifications
GET /api/notifications
Headers: Authorization: Bearer <token>
```

## 📊 Database Indexes

The notification model includes indexes for efficient queries:
- `userId + isRead + createdAt` - For user notification queries
- `userId` - For user-based lookups
- `isRead` - For unread count queries

## 🔐 Security

- Users can only see their own notifications
- Only admin can create notifications for other users
- All endpoints require authentication
- Proper authorization checks in place

