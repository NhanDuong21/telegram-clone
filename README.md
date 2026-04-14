# Telegram Web Clone

Created by Nyan

[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat&logo=socketdotio&logoColor=white)](https://socket.io/)

A professional, full-featured Telegram clone focused on high-fidelity performance and real-time communication. Built with a specialized focus on media handling and synchronized state across clients.

![Telegram Web Clone Demo](./demo.gif)

## Key Features

- **Internationalization (🌐):** Native support for English and Vietnamese language configurations.
- **Real-time Engine:** WebSocket integration via Socket.io for instant messaging, read receipts, and synchronization of online/typing status.
- **Smart Media Handling:** Advanced CSS Grid algorithms for localized "Smart Albums" (up to 5 photos) with real-time deletion synchronization and full-screen previews.
- **Dynamic UI (⚙️):** Fully functional scaling slider using CSS variables and dynamic theme toggling (Light/Dark).
- **User Management:** Optimized contact sidebars and reusable, read-only user profiles.

## Architecture

The project follows a decoupled client-server architecture to ensure scalability and separation of concerns. The frontend handles state management and real-time UI updates, while the backend manages the persistence layer and WebSocket broadcasting.

## Getting Started

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Nhan/telegram-clone.git
   cd telegram-clone
   ```

2. **Install dependencies (Client & Server)**
   ```bash
   # From root directory
   cd client && npm install
   cd ../server && npm install
   ```

3. **Configuration**
   Create a `.env` file in the `/server` directory:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_api_key
   CLOCUDINARY_API_SECRET=your_api_secret
   CLIENT_URL_DEV=http://localhost:5173
   ```

4. **Execution**
   ```bash
   # Terminal 1 (Backend)
   cd server && npm run dev

   # Terminal 2 (Frontend)
   cd client && npm run dev
   ```
