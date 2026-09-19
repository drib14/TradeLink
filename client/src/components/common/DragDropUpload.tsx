import React, { useState, useRef } from 'react';
import { Upload, X, Video, Film, Loader2 } from 'lucide-react';
import { useToast } from './Toast';
import { uploadFile } from '../../services/api';

interface DragDropUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxFiles?: number;
  label?: string;
  helperText?: string;
  isMultiple?: boolean;
  acceptVideos?: boolean;
}

function compressImageClient(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX_DIM = 1200;
      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      let dataUrl = canvas.toDataURL('image/webp', 0.75);
      if (!dataUrl.startsWith('data:image/webp')) {
        dataUrl = canvas.toDataURL('image/jpeg', 0.75);
      }
      resolve(dataUrl);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    };
    img.src = objectUrl;
  });
}

function compressImageToFile(file: File): Promise<File> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      return resolve(file);
    }
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX_DIM = 1200;
      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(file);
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file);
          const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), {
            type: 'image/webp'
          });
          resolve(compressedFile);
        },
        'image/webp',
        0.75
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };
    img.src = objectUrl;
  });
}

export const DragDropUpload: React.FC<DragDropUploadProps> = ({
  images,
  onChange,
  maxFiles = 10,
  label = 'Photos & Product Demonstration Videos',
  helperText = 'Drag & drop photos or product sample videos here, or browse',
  isMultiple = true,
  acceptVideos = true
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remainingSlots = isMultiple ? maxFiles - images.length : 1;
    if (remainingSlots <= 0) {
      showToast('Limit Reached', `Maximum ${maxFiles} media items allowed.`, 'warning');
      return;
    }

    const existingVideoCount = images.filter(isVideoItem).length;
    let addedVideoCount = 0;

    const validFiles = Array.from(files).filter((file) => {
      // Explicitly reject SVG for security
      if (file.type.includes('svg') || file.name.toLowerCase().endsWith('.svg')) {
        showToast('File Rejected', 'SVG files are prohibited for security.', 'error');
        return false;
      }
      const isImg = file.type.startsWith('image/');
      const isVid = acceptVideos && (file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(file.name));

      if (!isImg && !isVid) return false;

      if (isVid) {
        if (existingVideoCount + addedVideoCount >= 1) {
          showToast('Video Limit', 'Only 1 demonstration video is allowed per listing to optimize quota.', 'warning');
          return false;
        }
        addedVideoCount++;
      }

      return true;
    });

    if (validFiles.length === 0) {
      showToast('Invalid File', 'Please upload valid image or video files (JPG, PNG, WEBP, MP4, WEBM, MOV).', 'warning');
      return;
    }

    const filesToProcess = validFiles.slice(0, remainingSlots);
    const newItems: string[] = [];
    setIsUploading(true);

    try {
      for (const file of filesToProcess) {
        // 15MB limit for videos, 10MB limit for images
        if (file.size > 15 * 1024 * 1024) {
          showToast('File Too Large', `${file.name} is larger than 15MB limit.`, 'warning');
          continue;
        }

        // Optimize image client-side before sending to server/storage to preserve Cloudinary free tier
        const fileToUpload = file.type.startsWith('image/') ? await compressImageToFile(file) : file;

        // 1. Try uploading to server endpoint directly
        try {
          const uploadRes = await uploadFile(fileToUpload, 'listings');
          if (uploadRes && uploadRes.url) {
            newItems.push(uploadRes.url);
            continue;
          }
        } catch {
          // Fallback to local encoding if server is unreachable
        }

        // 2. Client fallback
        if (file.type.startsWith('image/')) {
          try {
            const compressed = await compressImageClient(file);
            newItems.push(compressed);
          } catch {
            const dataUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : '');
              reader.readAsDataURL(file);
            });
            if (dataUrl) newItems.push(dataUrl);
          }
        } else {
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : '');
            reader.readAsDataURL(file);
          });
          if (dataUrl) newItems.push(dataUrl);
        }
      }

      if (newItems.length > 0) {
        if (isMultiple) {
          onChange([...images, ...newItems]);
        } else {
          onChange(newItems);
        }
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleRemove = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  };

  const isVideoItem = (url: string) => {
    return (
      url.startsWith('data:video/') ||
      /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url) ||
      url.includes('/video/upload/')
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      {label && (
        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
          {label}
        </label>
      )}

      {/* Drag and Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: isDragging ? '2px dashed #FFC72C' : '2px dashed #BCD1F7',
          backgroundColor: isDragging ? '#FFFBEB' : '#F8FAFC',
          borderRadius: '12px',
          padding: '1.25rem 1rem',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.45rem',
          position: 'relative'
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptVideos ? 'image/*,video/*' : 'image/*'}
          multiple={isMultiple}
          onChange={(e) => handleFiles(e.target.files)}
          style={{ display: 'none' }}
        />

        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: isDragging ? '#FFC72C' : '#EBF1FC',
            color: '#002B7F',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            transform: isDragging ? 'scale(1.1)' : 'scale(1)'
          }}
        >
          {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
        </div>

        <div>
          <p style={{ fontSize: '0.84rem', fontWeight: 700, color: '#002B7F' }}>
            {isUploading ? 'Optimizing & uploading media...' : isDragging ? 'Drop media files here' : helperText}
          </p>
          <p style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
            Supports JPG, PNG, WEBP & MP4, WEBM, MOV videos up to 15MB
          </p>
        </div>
      </div>

      {/* Preview Grid */}
      {images.length > 0 && (
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
          {images.map((item, idx) => {
            const isVid = isVideoItem(item);

            return (
              <div
                key={idx}
                style={{
                  width: '92px',
                  height: '92px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  position: 'relative',
                  border: idx === 0 ? '2px solid #002B7F' : '1px solid #CBD5E1',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.06)',
                  backgroundColor: '#000'
                }}
              >
                {isVid ? (
                  <video
                    src={item}
                    muted
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <img src={item} alt={`Preview ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}

                {/* Video Indicator Tag */}
                {isVid && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '4px',
                      left: '4px',
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      color: '#FFC72C',
                      fontSize: '0.6rem',
                      fontWeight: 800,
                      padding: '2px 4px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px'
                    }}
                  >
                    <Film size={10} /> Video
                  </span>
                )}

                {/* Primary badge for first item */}
                {idx === 0 && isMultiple && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      backgroundColor: '#002B7F',
                      color: '#FFC72C',
                      fontSize: '0.6rem',
                      fontWeight: 800,
                      textAlign: 'center',
                      padding: '2px 0'
                    }}
                  >
                    Cover {isVid ? 'Video' : 'Photo'}
                  </span>
                )}

                {/* Remove button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(idx);
                  }}
                  style={{
                    position: 'absolute',
                    top: '3px',
                    right: '3px',
                    backgroundColor: 'rgba(15, 23, 42, 0.85)',
                    color: '#FFFFFF',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  title="Remove media"
                >
                  <X size={11} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
