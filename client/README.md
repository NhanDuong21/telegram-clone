# Telegram Web Clone - Frontend (React)

Technical documentation for the React-based frontend application.

## Stack
- **Library:** React 19
- **Build Tool:** Vite
- **Styling:** TailwindCSS & Vanilla CSS
- **Routing:** React Router 7

## Socket Integration
Real-time state is managed through the `useChatSocket` custom hook. This integration monitors specific events:
- `message-updated`: Triggers partial re-renders of existing messages (e.g., reaction updates).
- `message-deleted`: Handles real-time removal of messages or specific files within an album without full layout shifts.

The implementation ensures jump-free UI updates by pre-calculating aspect ratios for media content.

## Media Components
- **ImageAlbum:** Implements CSS Grid algorithms to dynamically arrange 1 to 5 images in a balanced layout.
- **RightSidebar:** Provides real-time media counters and categorized shared content views, synced with back-end aggregation.
