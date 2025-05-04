import { useState } from 'react';
import api from '../api';
import useLoginGate from './useLoginGate';
import '../styles/flagModal.css';

export default function useFlagModal(localUser) {
  const { guard, LoginModal } = useLoginGate(localUser);
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState(null); // { type:'post'|'comment', id }
  const [reason, setReason] = useState('');

  const flag = (type, id) => guard(() => {
    setTarget({ type, id });
    setReason('');
    setOpen(true);
  });

  const submit = async () => {
    try {
      await api.post(`/report/${target.type}`, {
        [`${target.type}_id`]: target.id,
        reason,
        user_id: localUser.id,
      });
      alert('Thanks! Our moderators will review.');
    } catch (e) {
      alert('Could not send report');
    } finally { setOpen(false); }
  };

  const Modal = !open ? null : (
    <div className="flag‑overlay">
      <div className="flag‑card">
        <h3>Report this {target.type}</h3>
        <textarea
          placeholder="Brief reason (optional)"
          value={reason}
          onChange={e => setReason(e.target.value)}
        />
        <div className="flag‑actions">
        <button className="flag‑btn flag‑btn--primary" onClick={submit}>Submit</button>
        <button className="flag‑btn flag‑btn--ghost"   onClick={() => setOpen(false)}>Cancel</button>
        </div>
      </div>
    </div>
  );

  return { flag, FlagModal: () => <>{LoginModal}{Modal}</> };
}
