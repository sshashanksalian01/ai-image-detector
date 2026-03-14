/**
 * ImageUploader.js
 * Drag-and-drop image uploader with preview and animated state transitions.
 */

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, ImageIcon, X, AlertCircle } from 'lucide-react';
import styles from './ImageUploader.module.css';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_TYPES = { 'image/jpeg': [], 'image/png': [], 'image/webp': [] };

export default function ImageUploader({ onImageSelect, selectedImage, disabled }) {
  const [error, setError] = useState(null);

  const onDrop = useCallback(
    (acceptedFiles, rejectedFiles) => {
      setError(null);

      // Handle rejection
      if (rejectedFiles.length > 0) {
        const reason = rejectedFiles[0].errors[0];
        if (reason.code === 'file-too-large') {
          setError('File is too large. Maximum size is 10 MB.');
        } else if (reason.code === 'file-invalid-type') {
          setError('Invalid file type. Please upload JPG, PNG, or WebP.');
        } else {
          setError('Could not upload file. Please try again.');
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        const previewUrl = URL.createObjectURL(file);
        onImageSelect({ file, previewUrl });
      }
    },
    [onImageSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    disabled,
  });

  const clearImage = (e) => {
    e.stopPropagation();
    setError(null);
    onImageSelect(null);
  };

  return (
    <div className={styles.wrapper}>
      {/* ── Drop Zone ── */}
      <div
        {...getRootProps()}
        className={`${styles.dropzone} ${isDragActive ? styles.dragging : ''} ${
          selectedImage ? styles.hasImage : ''
        } ${disabled ? styles.disabled : ''}`}
      >
        <input {...getInputProps()} />

        {selectedImage ? (
          /* ── Image Preview ── */
          <div className={styles.preview}>
            <img
              src={selectedImage.previewUrl}
              alt="Uploaded preview"
              className={styles.previewImg}
            />
            <div className={styles.previewOverlay}>
              <div className={styles.previewMeta}>
                <ImageIcon size={14} />
                <span>{selectedImage.file.name}</span>
                <span className={styles.fileSize}>
                  {(selectedImage.file.size / 1024).toFixed(1)} KB
                </span>
              </div>
              {!disabled && (
                <button
                  className={styles.clearBtn}
                  onClick={clearImage}
                  aria-label="Remove image"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* ── Empty State ── */
          <div className={styles.emptyState}>
            <div className={`${styles.iconWrap} ${isDragActive ? styles.iconActive : ''}`}>
              <Upload size={28} strokeWidth={1.5} />
              {/* Animated rings */}
              <span className={styles.ring} />
              <span className={`${styles.ring} ${styles.ring2}`} />
            </div>

            <div className={styles.emptyText}>
              {isDragActive ? (
                <p className={styles.dragActiveText}>Drop it like it's hot ✦</p>
              ) : (
                <>
                  <p className={styles.primaryText}>
                    Drag &amp; drop an image here
                  </p>
                  <p className={styles.secondaryText}>
                    or click to browse — JPG, PNG, WebP up to 10 MB
                  </p>
                </>
              )}
            </div>

            <div className={styles.formats}>
              {['JPG', 'PNG', 'WebP'].map((fmt) => (
                <span key={fmt} className={styles.formatBadge}>
                  {fmt}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Error Message ── */}
      {error && (
        <div className={styles.errorMsg} role="alert">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
