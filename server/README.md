# Telegram Web Clone - Backend (Node.js)

Technical specifications for the Node.js/Express backend services.

## Stack
- **Runtime:** Node.js
- **Framework:** Express
- **Database:** MongoDB / Mongoose

## Database Schema (Message Model)
The messaging system is designed to support rich media attachments. The `Message` model utilizes an `imageUrls` array to handle multiple files in a single unified message object, enabling the "Smart Album" functionality on the frontend.

## Socket Emitters
The server utilizes Socket.io for bi-directional communication.
- **Room Strategy:** Clients join specific rooms organized by `conversationId`.
- **Broadcasting:** Events are targeted to specific rooms to minimize network overhead while ensuring all participants receive timely state updates.

## Services
- **Cloudinary Integration:** Manages persistent storage for all uploaded media files.
- **Authentication:** JWT-based stateless authentication system.
