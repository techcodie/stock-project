import { FileText, Trash2, Loader2, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import api from '../../services/api';

function DocumentList({ documents, selectedId, onSelect, onDelete, loading }) {
  if (loading) {
    return (
      <div style={styles.loading}>
        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
        <span>Loading documents...</span>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return <div style={styles.empty}>No documents yet. Upload one above.</div>;
  }

  /**
   * Download the chunks (i.e., the exact text the LLM sees) as a .txt file.
   * Useful for verifying LLM answers against the source.
   */
  const handleDownload = async (e, doc) => {
    e.stopPropagation();
    try {
      const res = await api.get(`/ai/documents/${doc.id}/content`, {
        responseType: 'blob',
      });
      // Backend streams the original PDF.
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      // Keep the original filename (already .pdf) — falls back if missing.
      a.download = doc.filename || 'document.pdf';
      window.document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download document.');
    }
  };

  return (
    <ul style={styles.list}>
      {documents.map((doc) => {
        const isSelected = doc.id === selectedId;
        const isReady = doc.status === 'ready';
        const isFailed = doc.status === 'failed';
        const isProcessing = doc.status === 'processing';

        return (
          <li key={doc.id}>
            <div
              onClick={() => isReady && onSelect(doc)}
              style={{
                ...styles.item,
                borderColor: isSelected
                  ? 'rgba(255,255,255,0.35)'
                  : 'rgba(255,255,255,0.08)',
                background: isSelected
                  ? 'rgba(255,255,255,0.05)'
                  : 'rgba(255,255,255,0.02)',
                cursor: isReady ? 'pointer' : 'not-allowed',
                opacity: isReady ? 1 : 0.75,
              }}
            >
              <FileText
                size={16}
                color={isFailed ? '#fb7185' : isReady ? '#ffffff' : '#fcd34d'}
                style={{ flexShrink: 0, marginTop: '2px' }}
              />
              <div style={styles.itemBody}>
                <div style={styles.itemName} title={doc.filename}>
                  {doc.filename}
                </div>
                <div style={styles.itemMeta}>
                  {doc.pageCount > 0 && <span>{doc.pageCount} pages</span>}
                  {isReady && (
                    <span style={{ ...styles.status, color: '#34d399' }}>
                      <CheckCircle2 size={11} />
                      ready
                    </span>
                  )}
                  {isProcessing && (
                    <span style={{ ...styles.status, color: '#fcd34d' }}>
                      <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
                      processing
                    </span>
                  )}
                  {isFailed && (
                    <span style={{ ...styles.status, color: '#fb7185' }}>
                      <AlertCircle size={11} />
                      failed
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div style={styles.actions}>
                {isReady && (
                  <button
                    onClick={(e) => handleDownload(e, doc)}
                    style={styles.downloadBtn}
                    aria-label="Download document text"
                    title="Download indexed text (.txt) — verify the LLM's source"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(52,211,153,0.12)';
                      e.currentTarget.style.borderColor = 'rgba(52,211,153,0.5)';
                      e.currentTarget.style.color = '#34d399';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)';
                      e.currentTarget.style.color = '#e4e4e7';
                    }}
                  >
                    <Download size={15} />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(doc.id);
                  }}
                  style={styles.deleteBtn}
                  aria-label="Delete document"
                  title="Delete"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(244,63,94,0.12)';
                    e.currentTarget.style.borderColor = 'rgba(244,63,94,0.5)';
                    e.currentTarget.style.color = '#fb7185';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)';
                    e.currentTarget.style.color = '#a1a1aa';
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </li>
        );
      })}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </ul>
  );
}

const styles = {
  loading: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#a1a1aa',
    padding: '8px 4px',
  },
  empty: {
    fontSize: '12px',
    color: '#71717a',
    textAlign: 'center',
    padding: '12px',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  item: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.02)',
    transition: 'all 0.15s ease',
  },
  itemBody: {
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#ffffff',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: 1.3,
  },
  itemMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
    marginTop: '6px',
    fontSize: '11px',
    color: '#71717a',
  },
  status: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontWeight: 500,
  },
  actions: {
    display: 'flex',
    flexDirection: 'row',
    gap: '6px',
    flexShrink: 0,
    alignItems: 'flex-start',
  },
  downloadBtn: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.18)',
    color: '#e4e4e7',
    cursor: 'pointer',
    padding: '6px 8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    transition: 'all 0.15s ease',
  },
  deleteBtn: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.18)',
    color: '#a1a1aa',
    cursor: 'pointer',
    padding: '6px 8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    transition: 'all 0.15s ease',
  },
};

export default DocumentList;
