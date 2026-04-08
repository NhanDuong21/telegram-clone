# Telegram Web Clone

Ứng dụng chat real-time mô phỏng Telegram, sử dụng MERN stack + TypeScript.

## Tech Stack

| Layer    | Stack                          |
| -------- | ------------------------------ |
| Frontend | React 18 + TypeScript + Vite   |
| Backend  | Node.js + Express + TypeScript |
| Database | MongoDB + Mongoose             |
| Auth     | JWT (Bearer token) + bcrypt    |
| Realtime | (chưa) Socket.IO               |

## Cấu trúc thư mục

```
telegram-clone/
├── client/                  # Frontend (Vite + React)
│   └── src/
│       ├── api/             # Gọi API (axios)
│       │   └── authApi.ts
│       ├── components/chat/ # Components chat (chưa implement)
│       │   ├── Sidebar.tsx
│       │   ├── ChatBox.tsx
│       │   └── MessageInput.tsx
│       ├── context/
│       │   └── AuthContext.tsx
│       ├── pages/
│       │   ├── LoginPage.tsx
│       │   ├── RegisterPage.tsx
│       │   ├── ChatPage.tsx
│       │   └── NotFoundPage.tsx
│       ├── App.tsx
│       └── main.tsx
├── server/                  # Backend (Express)
│   └── src/
│       ├── config/db.ts
│       ├── controllers/authController.ts
│       ├── middlewares/authMiddleware.ts
│       ├── models/User.ts
│       ├── routes/authRoutes.ts
│       ├── utils/generateToken.ts
│       ├── app.ts
│       └── server.ts
├── PROJECT_CONTEXT.md
└── ROADMAP.md
```

## Đã xong

- **Backend auth**: register, login, GET /me (protected bằng JWT middleware)
- **User model**: username, email, password (bcrypt hash), avatar, timestamps
- **Frontend auth**: AuthContext (login/logout/fetchMe), route guards, persist session qua localStorage
- **Pages**: LoginPage, RegisterPage, ChatPage (layout cơ bản + logout), NotFoundPage

## Chưa làm

- Chat components (Sidebar, ChatBox, MessageInput) — file rỗng
- Conversation & Message models + API
- Real-time (Socket.IO)
- UI/UX styling

## Coding Conventions

- Backend: function-based controllers, async/await, error trả JSON `{ message }`
- Frontend: functional components, hooks, axios cho API calls
- Auth: token lưu localStorage, gửi qua header `Authorization: Bearer <token>`
- Naming: camelCase cho biến/hàm, PascalCase cho components/models
- API base URL: `http://localhost:5000/api`
