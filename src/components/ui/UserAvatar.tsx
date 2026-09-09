"use client";

import React, { useState } from "react";
import Image from "next/image";

interface UserAvatarProps {
  user?: {
    name?: string | null;
    avatarUrl?: string | null;
    email?: string | null;
  } | null;
  size?: number;
  className?: string;
  alt?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 32,
  className = "",
  alt,
}) => {
  const [imgError, setImgError] = useState(false);
  const avatarUrl = user?.avatarUrl?.trim();
  const displayName = user?.name || user?.email || "SC TECH User";
  const imageAlt = alt || displayName;

  // Custom User Uploaded Photo
  if (avatarUrl && !imgError) {
    return (
      <div
        className={`relative rounded-full overflow-hidden shrink-0 border border-blue-500/30 shadow-md ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={avatarUrl}
          alt={imageAlt}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      </div>
    );
  }

  // Default SC TECH Official Avatar / Logo
  return (
    <div
      className={`relative rounded-full overflow-hidden shrink-0 bg-[#070D1A] border border-blue-500/30 flex items-center justify-center p-0.5 shadow-md ${className}`}
      style={{ width: size, height: size }}
      title={displayName}
    >
      <Image
        src="/logo.png"
        alt="SC TECH Default Avatar"
        width={size}
        height={size}
        className="w-full h-full object-contain"
        priority={false}
      />
    </div>
  );
};
