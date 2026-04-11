# Telegram Web Clone

Một ứng dụng chat real-time hiện đại mô phỏng Telegram Web, được xây dựng với hiệu suất cao và trải nghiệm người dùng mượt mà.

## Tech Stack

| Layer    | Stack                                      |
| -------- | ------------------------------------------ |
| Frontend | React 19 + TypeScript + Vite + TailwindCSS |
| Backend  | Node.js + Express + TypeScript             |
| Realtime | Socket.IO (Global Sync Protocol)           |
| Database | MongoDB + Mongoose                         |
| Storage  | Cloudinary (Direct Upload + Compression)   |
| Animation| Framer Motion                              |

## Cấu trúc dự án (Modular & Clean)

```
telegram-clone/
├── client/              # Frontend Workspace
│   ├── src/
│   │   ├── api/         # Axios API clients
│   │   ├── components/  # Modular components (chat, profile, common)
│   │   ├── context/     # Auth & App state providers
│   │   ├── hooks/       # Custom hooks (socket, chat actions)
│   │   └── pages/       # Page-level components
├── server/              # Backend Workspace
│   ├── src/
│   │   ├── config/      # DB & App configurations
│   │   ├── controllers/ # Logic handlers
│   │   ├── models/      # Mongoose schemas
│   │   ├── services/    # Business logic
│   │   └── socket.ts    # Real-time event engine
└── README.md
```

## Tính năng nổi bật

- **Global Real-time Sync**: Nhận tin nhắn và thông báo tức thì trên mọi thiết bị và cuộc trò chuyện ngay sau khi đăng nhập.
- **High-Performance Upload**: Nén ảnh trực tiếp trên trình duyệt và upload thẳng lên Cloudinary, bỏ qua bottleneck của server.
- **Responsive 100dvh Layout**: Tối ưu hoàn hảo cho cả thiết bị di động và máy tính với các hiệu ứng micro-animations cao cấp.
- **Group Management**: Tạo nhóm, thêm/xóa thành viên và cập nhật thông tin nhóm theo thời gian thực.
- **Advanced Auth**: Luồng đăng ký/đăng nhập an toàn với JWT, bảo mật và cực kỳ mượt mà.

## Coding Conventions

- **Clean Code**: Không console.log, không debugger, cấu trúc modular rõ ràng.
- **Performance**: Bypass server cho media, global socket room management.
- **Typing**: TypeScript nghiêm ngặt trên toàn bộ hệ thống.
