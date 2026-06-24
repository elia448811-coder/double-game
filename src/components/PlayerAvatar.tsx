import type { CSSProperties } from 'react';

type PlayerAvatarProps = {
  avatar: string;
  color: string;
  name: string;
  active?: boolean;
  size?: 'sm' | 'md' | 'lg';
};

export function PlayerAvatar({ avatar, color, name, active, size = 'md' }: PlayerAvatarProps) {
  return (
    <div
      className={`player-avatar player-avatar--${size} ${active ? 'player-avatar--active' : ''}`}
      style={{ '--avatar-color': color } as CSSProperties}
      title={name}
      aria-label={name}
    >
      <span className="player-avatar__emoji">{avatar}</span>
    </div>
  );
}
