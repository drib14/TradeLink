import React, { useState } from 'react';
import { Listing, ListingVariation } from '../../types';
import { useMarket } from '../../context/MarketContext';
import { useToast } from '../common/Toast';
import { Modal } from '../common/Modal';
import { DeleteWithReasonModal } from '../common/DeleteWithReasonModal';
import {
  CheckCircle2,
  RotateCcw,
  Trash2,
  Save,
  ExternalLink,
  Eye,
  ShoppingBag,
  Loader2,
  PackageCheck
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
  const { updateListing, markAsSold, deleteListing, toggleVariationSold } = useMarket();
  const { showToast } = useToast();

  const [price, setPrice] = useState<number | ''>(listing.price !== undefined && listing.price !== null ? listing.price : '');
  const [quantity, setQuantity] = useState<number | ''>(listing.quantity ?? 1);
  const [description, setDescription] = useState<string>(listing.description || '');
  const [isSold, setIsSold] = useState<boolean>(Boolean(listing.isSold));
  const [variations, setVariations] = useState<ListingVariation[]>(listing.variations || []);
  const [togglingVariantId, setTogglingVariantId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingSold, setIsTogglingSold] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  React.useEffect(() => {
    if (isOpen && listing) {
      setPrice(listing.price !== undefined && listing.price !== null ? listing.price : '');
      setQuantity(listing.quantity ?? 1);
      setDescription(listing.description || '');
      setIsSold(Boolean(listing.isSold));
      setVariations(listing.variations || []);
    }
  }, [isOpen, listing]);

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

  const handleToggleVariantSold = async (variationId: string) => {
    setTogglingVariantId(variationId);
    try {
      const targetVar = variations.find((v) => v.id === variationId);
      if (!targetVar) return;
      const nextAvailable = !(targetVar.isAvailable !== false);

      await toggleVariationSold(listing.id, variationId, nextAvailable);

      const nextVars = variations.map((v) =>
        v.id === variationId
          ? { ...v, isAvailable: nextAvailable, quantity: nextAvailable ? Math.max(1, v.quantity || 1) : 0 }
          : v
      );
      setVariations(nextVars);

      const allSold = nextVars.length > 0 && nextVars.every((v) => v.isAvailable === false);
      if (allSold) {
        setIsSold(true);
      } else if (isSold && nextAvailable) {
        setIsSold(false);
      }

      showToast(
        nextAvailable ? 'Variant Available' : 'Variant Sold Out',
        `"${targetVar.title}" marked as ${nextAvailable ? 'available' : 'sold out'}.`,
        'success'
      );
    } catch (err: any) {
      showToast('Update Failed', err?.message || 'Failed to update variant status.', 'error');
    } finally {
      setTogglingVariantId(null);
    }
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalPrice = price === '' ? 0 : Number(price);
    if (isNaN(finalPrice) || finalPrice < 0) {
      showToast('Invalid Price', 'Price cannot be negative.', 'warning');
      return;
    }
    const finalQuantity = quantity === '' ? 0 : Number(quantity);
    if (isNaN(finalQuantity) || finalQuantity < 0) {
      showToast('Invalid Quantity', 'Quantity cannot be negative.', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      await updateListing(listing.id, {
        price: finalPrice,
        quantity: finalQuantity,
        description: description.trim(),
        isSold,
        status: isSold ? 'sold' : 'active',
        variations
      });
      showToast('Listing Updated', 'Your changes have been saved.', 'success');
      onClose();
    } catch (err: any) {
      showToast('Save Failed', err?.message || 'Failed to save changes.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async (reason: string) => {
    setIsDeleting(true);
    try {
      await deleteListing(listing.id, reason);
      showToast(
        'Listing Removed',
        `"${listing.title}" has been removed from TradeLink. Reason: "${reason}".`,
        'info'
      );
      setShowDeleteModal(false);
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

  const primaryImage =
    listing.images?.[0] ||
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80';

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
                {variations.length > 0 && (
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.45rem',
                      borderRadius: '4px',
                      backgroundColor: 'var(--uc-blue-subtle, #EBF1FC)',
                      color: 'var(--uc-blue, #002B7F)',
                      border: '1px solid #CBD5E1'
                    }}
                  >
                    {variations.filter((v) => v.isAvailable !== false).length} / {variations.length} Variants Available
                  </span>
                )}
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
              <div
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
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
                  <span>Mark Overall Listing as Available</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  <span>Mark Entire Listing as Sold</span>
                </>
              )}
            </button>
          </div>

          {/* Variant-Level Sold Selector (if item has variants) */}
          {variations && variations.length > 0 && (
            <div
              style={{
                backgroundColor: 'var(--bg-subtle, #F8FAFC)',
                border: '1.5px solid var(--border-subtle, #E2E8F0)',
                borderRadius: '10px',
                padding: '0.9rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <PackageCheck size={16} color="var(--uc-blue)" />
                  Variant Stock & Sold Status ({variations.length})
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Click to mark sold or in-stock
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '200px', overflowY: 'auto' }}>
                {variations.map((v) => {
                  const isVarSold = v.isAvailable === false;
                  return (
                    <div
                      key={v.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '8px',
                        backgroundColor: '#FFFFFF',
                        border: isVarSold ? '1px solid #FECACA' : '1px solid var(--border-subtle, #E2E8F0)',
                        gap: '0.65rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: 0 }}>
                        <div
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: isVarSold ? '#EF4444' : '#10B981',
                            flexShrink: 0
                          }}
                        />
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              color: isVarSold ? 'var(--text-muted)' : 'var(--text-primary)',
                              textDecoration: isVarSold ? 'line-through' : 'none',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {v.title}
                          </div>
                          {v.price !== null && v.price !== undefined && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                              ₱{v.price.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '0.12rem 0.45rem',
                            borderRadius: '4px',
                            backgroundColor: isVarSold ? '#FEE2E2' : '#ECFDF5',
                            color: isVarSold ? '#991B1B' : '#047857',
                            border: `1px solid ${isVarSold ? '#FCA5A5' : '#A7F3D0'}`
                          }}
                        >
                          {isVarSold ? 'Sold' : 'Available'}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleToggleVariantSold(v.id)}
                          disabled={togglingVariantId === v.id}
                          style={{
                            padding: '0.35rem 0.65rem',
                            borderRadius: '6px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: isVarSold ? '1px solid #10B981' : '1px solid #EF4444',
                            backgroundColor: isVarSold ? '#ECFDF5' : '#FEF2F2',
                            color: isVarSold ? '#047857' : '#DC2626',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {togglingVariantId === v.id ? (
                            <Loader2 size={12} className="spin-animation" />
                          ) : isVarSold ? (
                            <>
                              <RotateCcw size={12} />
                              <span>Set Available</span>
                            </>
                          ) : (
                            <>
                              <ShoppingBag size={12} />
                              <span>Mark Sold</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Edit Form */}
          <form onSubmit={handleSaveDetails} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: '0.3rem'
                  }}
                >
                  Price (₱ PHP)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={price === '' ? '' : price}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setPrice('');
                    } else {
                      const num = parseFloat(val);
                      setPrice(isNaN(num) ? '' : Math.max(0, num));
                    }
                  }}
                  className="clean-input"
                  style={{ fontWeight: 700 }}
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: '0.3rem'
                  }}
                >
                  Stock / Quantity Available
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={quantity === '' ? '' : quantity}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setQuantity('');
                    } else {
                      const num = parseInt(val, 10);
                      setQuantity(isNaN(num) ? '' : Math.max(0, num));
                    }
                  }}
                  className="clean-input"
                  style={{ fontWeight: 700 }}
                  placeholder="1"
                  required
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '0.3rem'
                }}
              >
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
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.5rem',
                paddingTop: '0.25rem'
              }}
            >
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
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

      {/* Soft Delete with Reason Modal */}
      <DeleteWithReasonModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Listing"
        entityName={listing.title}
        entityType="listing"
        isLoading={isDeleting}
      />
    </>
  );
};
