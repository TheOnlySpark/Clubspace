"use client";

import * as React from 'react';
import styles from './CreateClubModal.module.css';

interface CreateClubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newClub: any) => void;
}

export default function CreateClubModal({ isOpen, onClose, onSuccess }: CreateClubModalProps) {
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [privacy, setPrivacy] = React.useState('university');
  const [joinPolicy, setJoinPolicy] = React.useState('invite');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/admin/clubs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          privacy,
          join_policy: joinPolicy,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create club');
      }

      const newClub = await response.json();
      
      // Reset form
      setName('');
      setDescription('');
      setPrivacy('university');
      setJoinPolicy('invite');
      
      onSuccess(newClub);
      onClose();
    } catch (err: any) {
      setError(err.message ?? 'Failed to create club');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Create New Club</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="clubName" className={styles.label}>Club Name</label>
            <input
              id="clubName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={styles.input}
              placeholder="e.g. Computer Science Society"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="clubDescription" className={styles.label}>Description</label>
            <textarea
              id="clubDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={styles.textarea}
              placeholder="What is this club about?"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="clubPrivacy" className={styles.label}>Privacy</label>
            <select
              id="clubPrivacy"
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value)}
              className={styles.select}
            >
              <option value="university">University Only (Visible to university members)</option>
              <option value="members">Private (Hidden, invite only)</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="clubJoinPolicy" className={styles.label}>Join Policy</label>
            <select
              id="clubJoinPolicy"
              value={joinPolicy}
              onChange={(e) => setJoinPolicy(e.target.value)}
              className={styles.select}
            >
              <option value="open">Open (University Members Only)</option>
              <option value="approval">Request (Requires approval)</option>
              <option value="invite">Invite Only</option>
            </select>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.footer}>
            <button type="button" onClick={onClose} className={styles.cancelButton} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? 'Creating...' : 'Create Club'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
