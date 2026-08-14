import { useState } from 'react';
import Modal from '../../components/Modal';

type Props = {
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading: boolean;
};

export default function RejectLeaveModal({ onClose, onConfirm, loading }: Props) {
  const [reason, setReason] = useState('');

  return (
    <Modal
      title="Reject leave request"
      onClose={onClose}
      actions={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={() => onConfirm(reason)} disabled={loading || !reason.trim()}>
            {loading ? 'Rejecting…' : 'Reject'}
          </button>
        </>
      }
    >
      <div className="field">
        <label className="field-label">Reason for rejection</label>
        <textarea className="input" value={reason} onChange={(event) => setReason(event.target.value)} required />
      </div>
    </Modal>
  );
}
