// src/hooks/useLoginGate.jsx
import { useAuth0 } from '@auth0/auth0-react';
import { useState } from 'react';
import '../styles/loginGate.css';


export default function useLoginGate(localUser) {
  const { loginWithRedirect, isAuthenticated } = useAuth0();
  const [open, setOpen] = useState(false);

  /** call inside any onClick/onSubmit */
  const guard = (fn) => {
    if (isAuthenticated && localUser) return fn(); // ✅ already logged in
    setOpen(true);                                // show modal
  };

  const Modal =
  !open ? null : (
    <div className="login‑gate__overlay" onClick={() => setOpen(false)}>
      <div
        className="login‑gate__card"
        onClick={e => e.stopPropagation()}   // prevent backdrop click
      >
        <h2 className="login‑gate__title">Sign in to continue</h2>
        <p  className="login‑gate__text">
          You need an account to perform actions.
        </p>

        <button
          className="login‑gate__btn login‑gate__btn--primary"
          onClick={() =>
            loginWithRedirect({
              appState: { returnTo: window.location.pathname }
            })
          }
        >
          Log in&nbsp;/&nbsp;Sign up
        </button>

        <button
          className="login‑gate__btn login‑gate__btn--ghost"
          onClick={() => setOpen(false)}
        >
          Maybe later
        </button>
      </div>
    </div>
  );


  return { guard, LoginModal: Modal };
}
