import './AccessDenied.css';

interface AccessDeniedProps {
  uid: string;
}

export default function AccessDenied({ uid }: AccessDeniedProps) {
  return (
    <div className="access-denied">
      <div className="access-denied-container">
        <h1>Access Denied</h1>
        <code>{uid}</code>
      </div>
    </div>
  );
}
