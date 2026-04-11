# Telegram Clone

A professional, real-time messaging application inspired by Telegram Desktop, built with a modern full-stack architecture.

##Introduction
This project is a high-performance messaging platform that supports real-time communication, group chats, and multimedia sharing. It features a sleek, responsive UI with dark mode support and mobile-first design.

## 🛠️ Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, Vanilla CSS (Modular BEM).
- **Backend**: Node.js, Express.
- **Database**: MongoDB (Mongoose).
- **Real-time**: Socket.IO.
- **Cloud Storage**: Cloudinary (for avatars and image messages).
- **Authentication**: JWT (JSON Web Tokens).

##Key Features
- **Real-time Messaging**: Instant message delivery using WebSocket.
- **Group Chats**: Create and manage group conversations with multiple members.
- **Image Uploads**: Share images effortlessly with Cloudinary integration.
- **Typing Indicators**: See when others are typing in real-time.
- **Read Receipts**: Visual confirmation (single/double checkmarks) when messages are read.
- **User Profiles**: View and edit user profiles, bios, and avatars.
- **Online Status**: Real-time tracking of user connectivity.
- **Mobile Responsive**: Optimised experience for both desktop and mobile devices.

##Setup Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account or local MongoDB instance.
- Cloudinary account.

### 1. Clone the Repository
```bash
git clone <repository-url>
cd telegram-clone
```

### 2. Backend Setup
```bash
cd server
npm install
```
Create a `.env` file in the `server` directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NODE_ENV=development
```

### 3. Frontend Setup
```bash
cd ../client
npm install
```
Create a `.env` file in the `client` directory:
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 4. Running the App
- **Server**: `npm run dev` (inside `/server`)
- **Client**: `npm run dev` (inside `/client`)

## Deployment
The application is ready for production and is hosted on **Render**. 
- Backend acts as a RESTful API and WebSocket server.
- Frontend is served as a static SPA.
---
*Created as part of the Web Application Development course.*
