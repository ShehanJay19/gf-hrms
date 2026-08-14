function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function Avatar({ name }: { name: string }) {
  return <div className="cell-avatar">{initials(name) || '?'}</div>;
}
