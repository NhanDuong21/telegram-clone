# Telegram Web Clone - MVP Roadmap

## Phase 1: Auth cơ bản ✅

**Mục tiêu**: User có thể register, login, giữ session sau refresh, logout.

**Đầu ra**: Login/Register form → lưu JWT → vào ChatPage → logout.

**Checklist**:
- [x] User model (username, email, password, avatar)
- [x] POST /register + POST /login + GET /me
- [x] JWT middleware bảo vệ route
- [x] AuthContext (login, logout, fetchMe, persist token)
- [x] Route guards (redirect login ↔ chat)
- [x] Logout button trên ChatPage

---

## Phase 2: Conversation & User Search

**Mục tiêu**: User có thể tìm người khác và tạo conversation 1-1.

**Đầu ra**: Sidebar hiển thị danh sách conversations, có thể tạo mới.

**Phụ thuộc**: Phase 1

**Checklist**:
- [ ] Conversation model (participants, lastMessage, updatedAt)
- [ ] GET /api/users/search?q= (tìm user theo username)
- [ ] POST /api/conversations (tạo/tìm conversation 1-1)
- [ ] GET /api/conversations (danh sách conversations của user)
- [ ] Sidebar component: render danh sách conversations
- [ ] Dialog/modal tìm user và bắt đầu chat

---

## Phase 3: Messaging (REST)

**Mục tiêu**: Gửi và nhận tin nhắn trong conversation (chưa real-time).

**Đầu ra**: Chọn conversation → xem tin nhắn → gửi tin mới → refresh để thấy tin mới.

**Phụ thuộc**: Phase 2

**Checklist**:
- [ ] Message model (conversationId, sender, text, createdAt)
- [ ] POST /api/messages (gửi tin nhắn)
- [ ] GET /api/messages/:conversationId (lấy tin nhắn)
- [ ] ChatBox component: hiển thị danh sách tin nhắn
- [ ] MessageInput component: form gửi tin nhắn
- [ ] Auto scroll to bottom
- [ ] Cập nhật lastMessage trong conversation sau khi gửi

---

## Phase 4: Real-time (Socket.IO)

**Mục tiêu**: Tin nhắn hiển thị ngay lập tức không cần refresh.

**Đầu ra**: 2 user chat real-time, thấy tin mới ngay khi gửi.

**Phụ thuộc**: Phase 3

**Checklist**:
- [ ] Setup Socket.IO server (attach vào Express)
- [ ] Client connect socket khi đã login
- [ ] Join room theo conversationId
- [ ] Emit "sendMessage" → server broadcast → client nhận
- [ ] Typing indicator (optional)

---

## Phase 5: UI/UX

**Mục tiêu**: Giao diện giống Telegram, dễ dùng.

**Đầu ra**: Layout 2 cột, chat bubbles, avatar, responsive.

**Phụ thuộc**: Phase 3 (có thể làm song song Phase 4)

**Checklist**:
- [ ] Layout: sidebar cố định trái, chat area phải
- [ ] Chat bubbles: sent (phải, xanh) vs received (trái, xám)
- [ ] Avatar placeholder cho user
- [ ] Timestamp trên tin nhắn
- [ ] Responsive (mobile: ẩn sidebar khi đang chat)

---

## Phase 6: Polish (Optional)

**Mục tiêu**: Tính năng nâng cao.

**Phụ thuộc**: Phase 4 + 5

**Checklist**:
- [ ] Online/offline status
- [ ] Read receipts (đã xem)
- [ ] Emoji picker
- [ ] File/image upload
- [ ] Group chat
- [ ] Search messages
