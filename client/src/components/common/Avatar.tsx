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
  };

  // If avatar URL exists and hasn't failed loading
  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={resolvedName}
        className={`rounded-full object-cover object-center shrink-0 aspect-square ${className}`}
        style={{
          ...baseStyle,
        }}
        onError={() => setImgError(true)}
      />
    );
  }

  // Generate a stable color from id
  const avatarColors = [
    "#0088cc", "#e17055", "#00b894", "#6c5ce7",
    "#fdcb6e", "#e84393", "#00cec9", "#d63031",
  ];
  let hash = 0;
  for (let i = 0; i < resolvedId.length; i++) {
    hash = resolvedId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = avatarColors[Math.abs(hash) % avatarColors.length];

  const initials = conversation?.isGroup && !conversation.imageUrl 
    ? "👥" 
    : resolvedName.charAt(0).toUpperCase();

  return (
    <div
      className={`rounded-full shrink-0 aspect-square ${className}`}
      style={{
        ...baseStyle,
        backgroundColor: color,
        color: "white",
        fontWeight: 700,
        fontSize: size * 0.4,
      }}
    >
      {initials}
    </div>
  );
};

export default Avatar;
