import { useState } from "react";

interface AvatarProps {
  user: {
    _id: string;
    username: string;
    avatar?: string;
  } | null | undefined;
  size?: number;
}

const Avatar = ({ user, size = 44 }: AvatarProps) => {
  const [imgError, setImgError] = useState(false);

  // Fallback to unknown if user is null
  if (!user) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          backgroundColor: "#ccc",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: size * 0.4,
        }}
      >
        ?
      </div>
    );
  }

  // If avatar URL exists and hasn't failed loading
  if (user.avatar && !imgError) {
    return (
      <img
        src={user.avatar}
        alt={user.username}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
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
  for (let i = 0; i < user._id.length; i++) {
    hash = user._id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = avatarColors[Math.abs(hash) % avatarColors.length];

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: color,
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: size * 0.4,
        textTransform: "uppercase",
      }}
    >
      {user.username.charAt(0)}
    </div>
  );
};

export default Avatar;
