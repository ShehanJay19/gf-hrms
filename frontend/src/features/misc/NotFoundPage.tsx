import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="state-block">
      <div className="state-icon">🧭</div>
      <div className="state-title">Page not found</div>
      <p className="state-body">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn btn-secondary btn-sm">
        Back to Dashboard
      </Link>
    </div>
  );
}
