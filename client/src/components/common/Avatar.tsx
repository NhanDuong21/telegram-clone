import { useState, useRef } from "react";

interface AvatarProps {
  user?: {
    _id: string;
    username: string;
    fullName?: string;
    avatar?: string;
  } | null;
  conversation?: {
    _id: string;
    name?: string;
    imageUrl?: string;
    isGroup?: boolean;
  } | null;
  src?: string;
  name?: string;
  id?: string;
  size?: number;
  className?: string;
}

const Avatar = ({ user, conversation, src, name, id, size = 44, className = "" }: AvatarProps) => {
  const [imgError, setImgError] = useState(false);
  
  // Resolve the source, name, and ID based on props
  const resolvedSrc = src || user?.avatar || conversation?.imageUrl;
  const resolvedName = name || user?.fullName || user?.username || conversation?.name || "?";
  const resolvedId = id || user?._id || conversation?._id || "default";

  const prevSrc = useRef(resolvedSrc);

  if (resolvedSrc !== prevSrc.current) {
    setImgError(false);
    prevSrc.current = resolvedSrc;
  }

  const isLocalImage = resolvedSrc?.startsWith('data:') || resolvedSrc?.startsWith('blob:');
  const avatarUrl = resolvedSrc 
    ? (isLocalImage ? resolvedSrc : (resolvedSrc.includes('?') ? `${resolvedSrc}&t=${Date.now()}` : `${resolvedSrc}?t=${Date.now()}`))
    : null;

  const baseStyle = {
    width: `${size}px`,
    height: `${size}px`,
    minWidth: `${size}px`,
    minHeight: `${size}px`,
    borderRadius: "50%",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    aspectRatio: "1/1",
    border: "1px solid rgba(255, 255, 255, 0.05)", // Thin border to define edges in dark mode
  };

  // If avatar URL exists and hasn't failed loading
  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={resolvedName}
        className={`rounded-full object-cover object-center shrink-0 aspect-square border-[0.5px] border-white/10 ${className}`}
        style={{
          ...baseStyle,
        }}
        onError={() => setImgError(true)}
      />
    );
  }

  // Telegram-style gradients for placeholders
  const avatarGradients = [
    "linear-gradient(135deg, #ff885e 0%, #ff51a4 100%)", // Red/Orange
    "linear-gradient(135deg, #5bef9a 0%, #3e89fb 100%)", // Green/Blue
    "linear-gradient(135deg, #af51f9 0%, #5861f4 100%)", // Purple
    "linear-gradient(135deg, #ffc03d 0%, #ff6036 100%)", // Yellow/Orange
    "linear-gradient(135deg, #6fb9f3 0%, #328bf2 100%)", // Sky Blue
    "linear-gradient(135deg, #52cc60 0%, #299a38 100%)", // Green
  ];

  let hash = 0;
  for (let i = 0; i < resolvedId.length; i++) {
    hash = resolvedId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const gradient = avatarGradients[Math.abs(hash) % avatarGradients.length];

  const initials = conversation?.isGroup && !conversation.imageUrl 
    ? "👥" 
    : resolvedName.charAt(0).toUpperCase();

  return (
    <div
      className={`rounded-full shrink-0 aspect-square shadow-sm ${className}`}
      style={{
        ...baseStyle,
        background: gradient,
        color: "white",
        fontWeight: 600,
        fontSize: size * 0.45,
        textShadow: "0 1px 2px rgba(0,0,0,0.1)",
      }}
    >
      {initials}
    </div>
  );
};

export default Avatar;
