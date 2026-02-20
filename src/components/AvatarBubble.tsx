type Props = {
  initials: string;
  color: string;
};

export function AvatarBubble({ initials, color }: Props) {
  return (
    <div
      className="grid size-7 place-items-center rounded-full text-[11px] font-semibold text-white shadow-sm"
      style={{ backgroundColor: color }}
      aria-label={initials}
      title={initials}
    >
      {initials}
    </div>
  );
}
