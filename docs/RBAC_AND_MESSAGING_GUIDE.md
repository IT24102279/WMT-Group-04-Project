Role-Based Access Control & Messaging System - Implementation Guide

## Overview
The Pharmacy App now supports role-based access control with two main user types:
1. **Admin/Staff/Pharmacist** - Full access to all modules
2. **Customer (End-User)** - Limited access to appointments and messaging only

---

## User Roles

### Admin, Pharmacist, Staff (Full Access)
- Access all 6 main modules: Finance, Patients, Inventory, Support, Shop, Sales
- Can manage appointments (create/update/delete)
- Can manage support tickets
- Can view and reply to customer messages in dedicated "Messages" tab
- See full admin messaging interface with conversation list

### Customer (End-User - Limited Access)
- Only 2 tabs: "Appointments" and "Messages"
- Can create new appointments
- Cannot edit/delete appointments (readonly after creation)
- Cannot access support tickets
- Can send messages to admins/staff
- Can reply to admin messages
- Separate messaging interface for customers

---

## How to Register

### Admin/Staff Account
1. Open app and go to "Register" tab
2. Enter name, email, password
3. **Select account type: "Admin", "Pharmacist", or "Staff"**
4. Tap "Register"
5. You'll be automatically logged in with full app access

### Customer/End-User Account
1. Open app and go to "Register" tab
2. Enter name, email, password
3. **Select account type: "Customer (End User)"**
4. Tap "Register"
5. You'll be logged in with limited access (only Appointments & Messages tabs)

---

## Backend API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user (supports role parameter)
- POST `/api/auth/login` - Login user

### Messaging
- POST `/api/messages` - Send new message
- GET `/api/messages` - Get all messages for current user
- GET `/api/messages/conversations` - Get message conversations
- GET `/api/messages/thread/:messageId` - Get full message thread with replies
- POST `/api/messages/:messageId/reply` - Reply to a message
- PUT `/api/messages/:messageId/read` - Mark message as read
- DELETE `/api/messages/:messageId` - Delete message

### Appointments
- POST `/api/support/appointments` - Create appointment (customers can do this)
- GET `/api/support/appointments` - Get appointments (admin/staff only filtered)
- PUT `/api/support/appointments/:id` - Update appointment (admin/staff only)
- DELETE `/api/support/appointments/:id` - Delete appointment (admin/staff only)

---

## Mobile App Screens

### For Admin/Staff/Pharmacist
1. **Finance** - View charts, manage transactions
2. **Patients** - Manage patient records
3. **Inventory** - Manage inventory items
4. **Support** - Manage appointments and support tickets
5. **Shop** - Manage orders and deliveries
6. **Sales** - Manage POS transactions
7. **Messages** - View all customer conversations, send replies

### For Customers
1. **Appointments** - View/create your appointments
2. **Messages** - Send messages to admins, view conversations and replies

---

## Messaging Workflow

### Customer Messaging
1. Go to "Messages" tab
2. Tap "New Message" button
3. Enter message subject and content
4. Send to admin/staff
5. View conversation thread
6. Admin can reply, reply appears in thread
7. Mark messages as read

### Admin Messaging
1. Go to "Messages" tab (shown to admins as one of the tabs)
2. See list of customer conversations
3. Tap conversation to open thread
4. View all messages and replies
5. Type reply and send
6. Customer will see reply in their conversation

---

## Database Schema

### User Collection
```
{
  name: String (required)
  email: String (required, unique)
  password: String (hashed, required)
  role: String (enum: 'admin', 'pharmacist', 'staff', 'driver', 'customer')
  createdAt: Date
  updatedAt: Date
}
```

### Message Collection
```
{
  senderId: ObjectId (ref: User)
  senderRole: String (same as user role)
  recipientId: ObjectId (ref: User, optional for general messages)
  subject: String (required)
  content: String (required)
  threadId: ObjectId (ref: Message, if this is a reply)
  isReply: Boolean
  read: Boolean (default: false)
  createdAt: Date
  updatedAt: Date
}
```

---

## Security


### Token-Based Auth
- JWT tokens in Authorization header: `Bearer <token>`
- Tokens expire in 7 days
- Token persisted in AsyncStorage on mobile
- Restored on app restart

### Role-Based Access Control (RBAC)
- Backend middleware `authorizeRoles(...roles)` restricts endpoint access
- Frontend navigation limits UI based on user role
- Customers cannot access admin-only routes even if they somehow bypass UI

### Message Privacy
- Customers only see messages they sent/received
- Admins see all customer messages
- Delete only allowed by sender

---

## Testing Checklist

**Register & Login**
- [ ] Create admin account and verify full access
- [ ] Create customer account and verify limited access
- [ ] Login with both accounts
- [ ] Token persists after app restart

**Customer Messaging**
- [ ] Customer sends message to admin
- [ ] Message appears in admin's inbox
- [ ] Admin replies
- [ ] Reply visible to customer
- [ ] Customer replies back
- [ ] Full conversation thread maintained

**Customer Appointments**
- [ ] Customer can create appointment
- [ ] Appointment visible in list
- [ ] Cannot edit/delete appointment
- [ ] Admin can view customer appointments

**Admin Access**
- [ ] All 6 modules visible
- [ ] Can manage appointments (CRUD)
- [ ] Can manage support tickets
- [ ] Can see and reply to all customer messages

**Mobile Navigation**
- [ ] Customers see only: Appointments, Messages
- [ ] Admins see: Finance, Patients, Inventory, Support, Shop, Sales, Messages
- [ ] Logout clears user and token
- [ ] Tab visibility changes based on role

---

## Running the App

### Backend
```bash
cd backend
npm run dev
```

### Mobile (Expo)
```bash
cd mobile
npm run start
```

All features are now ready to test!
