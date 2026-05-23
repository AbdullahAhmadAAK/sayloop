import { Navigate } from 'react-router-dom';

/** Sign-up is handled by the 4-step onboarding wizard (Google → nickname → avatar → topics). */
export default function SignUpPage() {
  return <Navigate to="/onboarding" replace />;
}
