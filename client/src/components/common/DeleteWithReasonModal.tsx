import React, { useState } from 'react';
import { Modal } from './Modal';
import { AlertTriangle, Trash2, Info, Loader2 } from 'lucide-react';

export interface DeleteWithReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
  title?: string;
  entityName: string;
  entityType?: 'listing' | 'flash_request' | 'general';
  isLoading?: boolean;
}

const LISTING_REASONS = [
  'Sold outside TradeLink (classmate, dorm, or in-person)',
  'Item is damaged, lost, or no longer usable',
  'Decided to keep or give to a friend/relative',
  'Listing details need major rework / duplicate post',
  'Other reason (please describe below)'
];

const FLASH_REASONS = [
  'Already found and acquired this item',
  'No longer need this item for my class/term',
  'Found an alternative or borrowed from a classmate',
  'Created by mistake or test request',
  'Other reason (please describe below)'
];

const GENERAL_REASONS = [
  'No longer available',
  'Completed outside platform',
  'Created by mistake',
  'Other reason'
];

export const DeleteWithReasonModal: React.FC<DeleteWithReasonModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Item',
  entityName,
  entityType = 'listing',
  isLoading = false
}) => {
  const presets =
    entityType === 'listing'
      ? LISTING_REASONS
      : entityType === 'flash_request'
      ? FLASH_REASONS
      : GENERAL_REASONS;

  const [selectedPreset, setSelectedPreset] = useState<string>(presets[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedPreset(presets[0]);
      setCustomReason('');
      setSubmitting(false);
    }
  }, [isOpen, entityType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason =
      selectedPreset.includes('Other') && customReason.trim()
        ? customReason.trim()
        : customReason.trim()
        ? `${selectedPreset}: ${customReason.trim()}`
        : selectedPreset;

    setSubmitting(true);
    try {
      await onConfirm(finalReason);
    } finally {
      setSubmitting(false);
    }
  };

  const isBusy = isLoading || submitting;

  return (
    <Modal isOpen={isOpen} onClose={isBusy ? () => {} : onClose} title={title}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
        {/* Warning & Transparency Note */}
        <div
          style={{
            backgroundColor: '#FFFBEB',
            border: '1.5px solid #FCD34D',
            borderRadius: '10px',
            padding: '0.9rem 1rem',
            display: 'flex',
            gap: '0.65rem',
            alignItems: 'flex-start'
          }}
        >
          <AlertTriangle size={18} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.82rem', color: '#92400E', lineHeight: 1.5 }}>
            This will remove <strong>"{entityName}"</strong> from active searches. Past buyers and peers who transacted for this item will see your stated reason in their order history.
          </div>
        </div>

        {/* Reason Presets */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.82rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginBottom: '0.5rem'
            }}
          >
            Please select the reason for removal:
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {presets.map((reason) => {
              const isSelected = selectedPreset === reason;
              return (
                <label
                  key={reason}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.55rem 0.8rem',
                    borderRadius: '8px',
                    border: isSelected ? '1.5px solid var(--uc-blue, #002B7F)' : '1px solid var(--border-subtle, #E2E8F0)',
                    backgroundColor: isSelected ? 'var(--uc-blue-subtle, #EBF1FC)' : 'var(--bg-subtle, #F8FAFC)',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? 'var(--uc-blue, #002B7F)' : 'var(--text-primary)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <input
                    type="radio"
                    name="deletionReason"
                    value={reason}
                    checked={isSelected}
                    onChange={() => setSelectedPreset(reason)}
                    style={{ accentColor: 'var(--uc-blue, #002B7F)', cursor: 'pointer' }}
                  />
                  <span>{reason}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Custom / Additional explanation */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              marginBottom: '0.35rem'
            }}
          >
            Additional details or note (optional):
          </label>
          <textarea
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            rows={2}
            className="clean-input"
            style={{ width: '100%', fontSize: '0.82rem', resize: 'vertical' }}
            placeholder={
              selectedPreset.includes('Other')
                ? 'Please specify your reason for removing this item...'
                : 'Optional context for peers or past buyers...'
            }
            required={selectedPreset.includes('Other')}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.35rem' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="btn-secondary"
            style={{ padding: '0.6rem 1.15rem', fontSize: '0.82rem', fontWeight: 700 }}
          >
            Keep Item
          </button>

          <button
            type="submit"
            disabled={isBusy}
            style={{
              padding: '0.6rem 1.25rem',
              fontSize: '0.82rem',
              fontWeight: 800,
              color: '#FFFFFF',
              backgroundColor: '#DC2626',
              border: 'none',
              borderRadius: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: isBusy ? 'not-allowed' : 'pointer',
              opacity: isBusy ? 0.75 : 1,
              transition: 'background-color 0.15s ease'
            }}
          >
            {isBusy ? (
              <>
                <Loader2 size={15} className="spin-animation" />
                <span>Removing...</span>
              </>
            ) : (
              <>
                <Trash2 size={15} />
                <span>Confirm & Remove</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
