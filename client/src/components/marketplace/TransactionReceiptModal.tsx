import React from 'react';
import { Transaction } from '../../types';
import { Modal } from '../common/Modal';
import { CheckCircle2, Clock, XCircle, Copy, Printer, ShoppingBag, ShieldCheck } from 'lucide-react';
import { useToast } from '../common/Toast';

interface TransactionReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export const TransactionReceiptModal: React.FC<TransactionReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction
}) => {
  const { showToast } = useToast();

  if (!transaction) return null;

  const handleCopyRef = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(transaction.referenceNo);
      showToast('Copied to Clipboard', `Reference code ${transaction.referenceNo} copied!`, 'success');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = transaction.createdAt
    ? new Date(transaction.createdAt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'N/A';

  const statusColor =
    transaction.status === 'completed'
      ? { bg: '#DEF7EC', text: '#03543F', border: '#31C48D', icon: <CheckCircle2 size={16} /> }
      : transaction.status === 'cancelled'
      ? { bg: '#FDE8E8', text: '#9B1C1C', border: '#F98080', icon: <XCircle size={16} /> }
      : { bg: '#FEF08A', text: '#854D0E', border: '#FACC15', icon: <Clock size={16} /> };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="TradeLink Digital Receipt"
      subtitle="Official student transaction voucher for campus verification."
      maxWidth="520px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Receipt Header Card */}
        <div
          style={{
            border: '2px dashed var(--border-subtle, #CBD5E1)',
            borderRadius: '12px',
            padding: '1.25rem',
            backgroundColor: 'var(--bg-subtle, #F8FAFC)',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle, #E2E8F0)', paddingBottom: '0.85rem' }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>
                Order Reference Code
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.2rem' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--uc-blue, #002B7F)', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                  {transaction.referenceNo}
                </span>
                <button
                  type="button"
                  onClick={handleCopyRef}
                  style={{
                    border: 'none',
                    background: 'var(--uc-blue-subtle, #EBF1FC)',
                    color: 'var(--uc-blue)',
                    padding: '0.3rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Copy Reference Code"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>

            {/* Status Badge */}
            <div
              style={{
                backgroundColor: statusColor.bg,
                color: statusColor.text,
                border: `1px solid ${statusColor.border}`,
                padding: '0.35rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                textTransform: 'uppercase'
              }}
            >
              {statusColor.icon}
              <span>{transaction.status}</span>
            </div>
          </div>

          {/* Item Details */}
          <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', padding: '0.95rem 0', borderBottom: '1px solid var(--border-subtle, #E2E8F0)' }}>
            {transaction.listingImage ? (
              <img
                src={transaction.listingImage}
                alt={transaction.listingTitle}
                style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-subtle)' }}
              />
            ) : (
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)'
                }}
              >
                <ShoppingBag size={24} />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {transaction.listingTitle}
              </h4>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Trade Mode: <strong style={{ color: 'var(--uc-blue)' }}>{transaction.tradeMode === 'free_donation' ? 'Free Gift' : transaction.tradeMode === 'swap' ? 'Swap / Barter' : 'Sale'}</strong>
              </div>
            </div>
          </div>

          {/* Student Parties Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', padding: '0.85rem 0', borderBottom: '1px solid var(--border-subtle, #E2E8F0)', fontSize: '0.8rem' }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Seller</span>
              <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.15rem' }}>{transaction.sellerName}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Buyer</span>
              <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.15rem' }}>{transaction.buyerName}</div>
            </div>
          </div>

          {/* Settlement Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingTop: '0.85rem', fontSize: '0.84rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Payment Method:</span>
              <span style={{ fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-primary)' }}>{transaction.paymentMethod}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Payment Status:</span>
              <span style={{ fontWeight: 800, color: transaction.paymentStatus === 'paid' ? '#059669' : '#D97706', textTransform: 'capitalize' }}>
                {transaction.paymentStatus}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Transaction Placed:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formattedDate}</span>
            </div>
            {transaction.notes && (
              <div style={{ marginTop: '0.4rem', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-surface)', borderRadius: '6px', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                <strong>Order Note:</strong> {transaction.notes}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.6rem', paddingTop: '0.6rem', borderTop: '2px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>Total Settlement:</span>
              <span style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--uc-blue, #002B7F)', fontFamily: 'var(--font-display)' }}>
                {transaction.tradeMode === 'free_donation' ? 'FREE' : `₱${(transaction.amount || 0).toLocaleString()}`}
              </span>
            </div>
          </div>
        </div>

        {/* Campus Verification Tip */}
        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start', backgroundColor: 'var(--uc-blue-subtle)', borderRadius: '8px', padding: '0.75rem 0.95rem', fontSize: '0.76rem', color: 'var(--uc-blue)' }}>
          <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Campus Verification & Safety:</strong> Coordinate directly via Campus Chat to settle trades safely within official UC campus premises during daytime school hours.
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.25rem' }}>
          <button
            type="button"
            onClick={handlePrint}
            className="btn-secondary"
            style={{ padding: '0.6rem 1.15rem', fontSize: '0.82rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Printer size={15} />
            <span>Print Receipt</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn-primary"
            style={{ padding: '0.6rem 1.5rem', fontSize: '0.84rem', fontWeight: 800 }}
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
};
