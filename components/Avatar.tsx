import type { IMember } from '@/types';
import { cc, initials } from '@/lib/utils';

interface AvatarProps {
  member: IMember;
  index: number;
  size?: number;
  fontSize?: number;
  onClick?: () => void;
}

export default function Avatar({
  member,
  index,
  size = 34,
  fontSize = 12,
  onClick,
}: AvatarProps) {
  const col = cc(index);
  const baseStyle: React.CSSProperties = { width: size, height: size };

  const inner = member.photo ? (
    <div className="avatar" style={baseStyle}>
      <img src={member.photo} alt={member.name} />
    </div>
  ) : (
    <div
      className="avatar"
      style={{ ...baseStyle, fontSize, background: col.bg, color: col.color }}
    >
      {initials(member.name)}
    </div>
  );

  if (onClick) {
    return (
      <div
        className="avatar-wrap"
        style={{ width: size, height: size }}
        onClick={onClick}
      >
        {inner}
      </div>
    );
  }

  return inner;
}
