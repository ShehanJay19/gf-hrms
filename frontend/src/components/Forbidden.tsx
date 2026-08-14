import { Link } from 'react-router-dom';

export default function Forbidden() {
  return (
    <div className="state-block">
      <div className="state-icon">🔒</div>
      <div className="state-title">You don't have access to this page</div>
      <p className="state-body">Your account role doesn't include permission to view this section.</p>
      <Link to="/" className="btn btn-secondary btn-sm">
        Back to Dashboard
      </Link>
    </div>
  );
}
