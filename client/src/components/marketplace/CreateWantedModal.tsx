import React, { useState } from 'react';
import { useWanted } from '../../context/WantedContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';
import { Campus } from '../../types';
import { X, Plus } from 'lucide-react';

interface CreateWantedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateWantedModal: React.FC<CreateWantedModalProps> = ({
  isOpen,
  onClose
}) => {
  const { currentUser } = useAuth();
  const { addRequest } = useWanted();
  const { showToast } = useToast();

  const [itemTitle, setItemTitle] = useState('');
  const [category, setCategory] = useState('Textbooks');
  const [targetBudget, setTargetBudget] = useState(500);
  const [urgency, setUrgency] = useState<'Immediate / Urgent' | 'This Week' | 'Flexible'>('Immediate / Urgent');
  const [preferredCampus, setPreferredCampus] = useState<Campus>(currentUser?.campus || 'UC Main');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle.trim()) {
      showToast('Title Required', 'Please enter the item name.', 'warning');
      return;
    }

    addRequest({
      itemTitle: itemTitle.trim(),
      category,
      targetBudget,
      urgency,
      description: description.trim() || `Looking for ${itemTitle} in ${preferredCampus}.`,
      preferredCampus
    });

    showToast('Posted', `Request for "${itemTitle}" posted.`, 'success');
    onClose();
    setItemTitle('');
    setDescription('');
  };

  return (
    <div className="modal-backdrop-custom" onClick={onClose}>
      <div
        className="modal-card-custom"
        style={{
          maxWidth: '480px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawer-grabber-handle" />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#002B7F' }}>
              Looking For Request
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
              Post an item you're looking to buy or find on campus.
            </p>
          </div>

          <button onClick={onClose} style={{ color: '#64748B', padding: '0.25rem' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
              Item Name *
            </label>
            <input
              type="text"
              value={itemTitle}
              onChange={(e) => setItemTitle(e.target.value)}
              placeholder="Item name"
              className="clean-input"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
              >
                <option value="Textbooks">Textbooks</option>
                <option value="Electronics">Electronics</option>
                <option value="Uniforms & Gear">Uniforms & Scrubs</option>
                <option value="Instruments">Instruments & Tools</option>
                <option value="Fashion">Fashion & Shoes</option>
                <option value="Dorm">Dorm & Home</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                Budget (₱) *
              </label>
              <input
                type="number"
                min="0"
                step="50"
                value={targetBudget}
                onChange={(e) => setTargetBudget(Number(e.target.value))}
                className="clean-input"
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                Campus
              </label>
              <select
                value={preferredCampus}
                onChange={(e: any) => setPreferredCampus(e.target.value)}
                style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
              >
                <option value="UC Main">UC Main</option>
                <option value="UC Banilad">UC Banilad</option>
                <option value="UC LM">UC LM</option>
                <option value="UC METC">UC METC</option>
                <option value="UC Pardo-Talisay">UC Pardo-Talisay</option>
                <option value="UC South Campus">UC South Campus</option>
                <option value="UC Medical Center">UC Medical Center</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                Urgency
              </label>
              <select
                value={urgency}
                onChange={(e: any) => setUrgency(e.target.value)}
                style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
              >
                <option value="Immediate / Urgent">Urgent (24-48h)</option>
                <option value="This Week">This Week</option>
                <option value="Flexible">Flexible</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
              Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Details or condition preference..."
              className="clean-input"
              style={{ resize: 'none' }}
            />
          </div>

          <button type="submit" className="btn-gold" style={{ padding: '0.65rem', width: '100%', fontSize: '0.88rem', marginTop: '0.35rem' }}>
            <Plus size={16} /> Post Request
          </button>
        </form>
      </div>
    </div>
  );
};
