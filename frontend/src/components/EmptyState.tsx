import type { ReactNode } from 'react';

type Props = {
  icon?: string;
  title: string;
  body?: string;
  action?: ReactNode;
};

export default function EmptyState({ icon = '📭', title, body, action }: Props) {
  return (
    <div className="state-block">
      <div className="state-icon">{icon}</div>
      <div className="state-title">{title}</div>
      {body && <p className="state-body">{body}</p>}
      {action}
    </div>
  );
}
