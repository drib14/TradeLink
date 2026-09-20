import React, { useState } from 'react';
import { Listing } from '../../types';
import { useMarket } from '../../context/MarketContext';
import { useToast } from '../common/Toast';
import { Modal } from '../common/Modal';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  Sliders,
  CheckCircle2,
  RotateCcw,
  Trash2,
  Save,
  ExternalLink,
  Eye,
  ShoppingBag,
  Loader2,
  AlertTriangle
} from 'lucide-react';

interface ManageListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: Listing;
  onNavigate?: (view: string, param?: any) => void;
  onDeleted?: () => void;
}

export const ManageListingModal: React.FC<ManageListingModalProps> = ({
  isOpen,
  onClose,
  listing,
  onNavigate,
  onDeleted
}) => {
  const { updateListing, markAsSold, deleteListing } = useMarket();
  const { showToast } = useToast();

  const [price, setPrice] = useState<number>(listing.price);
  const [quantity, setQuantity] = useState<number>(listing.quantity ?? 1);
  const [description, setDescription] = useState<string>(listing.description || '');
  const [isSold, setIsSold] = useState<boolean>(Boolean(listing.isSold));
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingSold, setIsTogglingSold] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleSold = async () => {
    setIsTogglingSold(true);
    try {
      const nextSold = !isSold;
      await markAsSold(listing.id, nextSold);
      setIsSold(nextSold);
      showToast(
        nextSold ? 'Marked as Sold' : 'Listing Reactivated',
        nextSold
          ? `"${listing.title}" is now marked as sold.`
          : `"${listing.title}" is now active in the campus marketplace.`,
        'success'
      );
    } catch (err: any) {
      showToast('Error', err?.message || 'Failed to update listing status.', 'error');
    } finally {
      setIsTogglingSold(false);
    }
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (price < 0) {
      showToast('Invalid Price', 'Price cannot be negative.', 'warning');
      return;
    }
    if (quantity < 0) {
      showToast('Invalid Quantity', 'Quantity cannot be negative.', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      await updateListing(listing.id, {
        price,
        quantity,
        description: description.trim(),
        isSold,
        status: isSold ? 'sold' : 'active'
      });
      showToast('Listing Updated', 'Your changes have been saved.', 'success');
      onClose();
    } catch (err: any) {
      showToast('Save Failed', err?.message || 'Failed to save changes.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteListing(listing.id);
      showToast('Listing Deleted', `"${listing.title}" has been removed from TradeLink.`, 'info');
      setShowDeleteConfirm(false);
      onClose();
      if (onDeleted) {
        onDeleted();
      } else if (onNavigate) {
        onNavigate('marketplace');
      }
    } catch (err: any) {
      showToast('Delete Failed', err?.message || 'Failed to remove listing.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const primaryImage = listing.images?.[0] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80';

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Manage Your Listing">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Item Summary Card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '0.85rem',
            borderRadius: '10px',
            backgroundColor: 'var(--bg-subtle, #F8FAFC)',
            border: '1px solid var(--border-subtle, #E2E8F0)'
          }}
        >
          <img
            src={primaryImage}
            alt={listing.title}
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '8px',
              objectFit: 'cover',
              flexShrink: 0,
              backgroundColor: '#0F172A'
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.45rem',
                  borderRadius: '4px',
                  backgroundColor: isSold ? '#FEE2E2' : '#ECFDF5',
                  color: isSold ? '#991B1B' : '#047857',
                  border: `1px solid ${isSold ? '#FCA5A5' : '#A7F3D0'}`
                }}
              >
                {isSold ? 'Sold / Out of Stock' : 'Active Listing'}
              </span>
            </div>
            <h4
              style={{
                fontSize: '0.92rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                margin: '0.25rem 0 0.15rem 0',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {listing.title}
            </h4>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>{listing.category}</span>
              <span>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                <Eye size={12} /> {listing.views || 0} views
              </span>
            </div>
          </div>
        </div>

        {/* Quick Status Bar */}
        <div>
          {/* Status Toggle Button */}
          <button
            type="button"
            onClick={handleToggleSold}
            disabled={isTogglingSold}
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
              border: isSold ? '1.5px solid var(--accent-green, #10B981)' : '1.5px solid #F87171',
              backgroundColor: isSold ? 'var(--accent-green-subtle, #ECFDF5)' : '#FEF2F2',
              color: isSold ? 'var(--accent-green, #047857)' : '#DC2626',
              transition: 'all 0.15s ease'
            }}
          >
            {isTogglingSold ? (
              <Loader2 size={15} className="spin-animation" />
            ) : isSold ? (
              <>
                <RotateCcw size={15} />
                <span>Mark as Available</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={15} />
                <span>Mark as Sold</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Edit Form */}
        <form onSubmit={handleSaveDetails} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                Price (₱ PHP)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={price}
                onChange={(e) => setPrice(Math.max(0, Number(e.target.value)))}
                className="clean-input"
                style={{ fontWeight: 700 }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                Stock / Quantity Available
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(0, Number(e.target.value)))}
                className="clean-input"
                style={{ fontWeight: 700 }}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
              Listing Description / Notes
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="clean-input"
              style={{ fontSize: '0.84rem', resize: 'vertical' }}
              placeholder="Describe condition, inclusions, or meetup preferences..."
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', paddingTop: '0.25rem' }}>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              style={{
                padding: '0.6rem 0.9rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#DC2626',
                backgroundColor: 'transparent',
                border: '1px solid #FCA5A5',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                cursor: 'pointer'
              }}
            >
              <Trash2 size={14} />
              <span>{isDeleting ? 'Deleting...' : 'Delete Listing'}</span>
            </button>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate('item-detail', { id: listing.id });
                  }}
                  className="btn-secondary"
                  style={{ padding: '0.6rem 0.9rem', fontSize: '0.8rem', fontWeight: 700 }}
                >
                  <ExternalLink size={14} />
                  <span>View Full Page</span>
                </button>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="btn-primary"
                style={{ padding: '0.6rem 1.15rem', fontSize: '0.82rem', fontWeight: 800 }}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={14} className="spin-animation" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>

    {/* Delete Confirmation Modal */}
    <ConfirmModal
      isOpen={showDeleteConfirm}
      title="Delete Listing Permanently?"
      message={`Are you sure you want to permanently delete "${listing.title}"? This action cannot be undone and will remove the item from all searches.`}
      confirmText="Delete Listing"
      cancelText="Keep Listing"
      variant="danger"
      isLoading={isDeleting}
      onConfirm={handleConfirmDelete}
      onCancel={() => setShowDeleteConfirm(false)}
    />
  </>
  );
};
