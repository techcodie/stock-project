import { useRef, useState } from 'react';
import { Upload, FileText, Loader2, AlertCircle } from 'lucide-react';
import api from '../../services/api';

function PDFUpload({ onUploaded }) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [progressText, setProgressText] = useState('');

  const handleFiles = async (files) => {
    setError('');
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed.');
      return;
    }

    setUploading(true);
    setProgressText('Uploading PDF...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const t1 = setTimeout(() => setProgressText('Extracting text...'), 1200);
      const t2 = setTimeout(() => setProgressText('Generating embeddings...'), 3500);

      const res = await api.post('/ai/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      clearTimeout(t1);
      clearTimeout(t2);

      if (res.data.success) {
        onUploaded?.({
          id: res.data.data.documentId,
          filename: file.name,
          fileSize: file.size,
          pageCount: res.data.data.pageCount,
          chunkCount: res.data.data.chunkCount,
          status: 'ready',
        });
      } else {
        setError(res.data.message || 'Upload failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
      setProgressText('');
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div style={{ width: '100%' }}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        style={{
          ...styles.dropzone,
          borderColor: isDragging ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)',
          background: isDragging ? 'rgba(255,255,255,0.05)' : 'rgba(24,24,27,0.5)',
          cursor: uploading ? 'default' : 'pointer',
          pointerEvents: uploading ? 'none' : 'auto',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          style={{ display: 'none' }}
          onChange={(e) => handleFiles(e.target.files)}
        />

        {uploading ? (
          <div style={styles.uploadingBlock}>
            <div style={styles.iconWrap}>
              <Loader2 size={22} color="#ffffff" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
            <div style={styles.uploadingTitle}>{progressText}</div>
            <div style={styles.uploadingHint}>
              Parsing → chunking → embedding. Takes 5–20 seconds.
            </div>
          </div>
        ) : (
          <div style={styles.idleBlock}>
            <div style={styles.iconWrap}>
              <Upload size={22} color="#ffffff" />
            </div>
            <div style={styles.idleTitle}>Drop a financial PDF</div>
            <div style={styles.idleSubtitle}>or click to choose a file</div>
            <div style={styles.idleHint}>
              <FileText size={11} />
              <span>10-K · annual report · earnings — max 10 MB</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div style={styles.error}>
          <AlertCircle size={14} color="#fda4af" style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>{error}</span>
        </div>
      )}

      {/* Keyframes for spinner */}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

const styles = {
  dropzone: {
    position: 'relative',
    borderRadius: '12px',
    border: '1px dashed rgba(255,255,255,0.15)',
    padding: '32px 24px',
    textAlign: 'center',
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
  },
  iconWrap: {
    width: '52px',
    height: '52px',
    borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.04)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  idleBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  idleTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#ffffff',
    marginBottom: '4px',
  },
  idleSubtitle: {
    fontSize: '12px',
    color: '#a1a1aa',
    marginBottom: '14px',
  },
  idleHint: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    color: '#71717a',
  },
  uploadingBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  uploadingTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#ffffff',
    marginBottom: '6px',
  },
  uploadingHint: {
    fontSize: '11px',
    color: '#71717a',
    maxWidth: '260px',
    lineHeight: 1.5,
  },
  error: {
    marginTop: '10px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    fontSize: '12px',
    color: '#fecdd3',
    background: 'rgba(244,63,94,0.08)',
    border: '1px solid rgba(244,63,94,0.3)',
    borderRadius: '8px',
    padding: '10px 12px',
    lineHeight: 1.5,
  },
};

export default PDFUpload;
