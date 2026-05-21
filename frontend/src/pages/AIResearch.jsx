import { useEffect, useState } from 'react';
import { Sparkles, FileSearch, MessageSquare, Quote, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import PDFUpload from '../components/ai/PDFUpload';
import ChatBox from '../components/ai/ChatBox';
import DocumentList from '../components/ai/DocumentList';

function AIResearch() {
  const [documents, setDocuments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loadingDocs, setLoadingDocs] = useState(true);

  const fetchDocuments = async () => {
    setLoadingDocs(true);
    try {
      const res = await api.get('/ai/documents');
      if (res.data.success) setDocuments(res.data.data);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUploaded = (doc) => {
    setDocuments((prev) => [doc, ...prev.filter((d) => d.id !== doc.id)]);
    setSelected(doc);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this document and all its embeddings?')) return;
    try {
      await api.delete(`/ai/documents/${id}`);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.badge}>
            <Sparkles size={12} />
            <span>AI Research</span>
          </div>
          <h1 style={styles.title}>Financial Report Analysis</h1>
          <p style={styles.subtitle}>
            Upload a 10-K, annual report, or earnings release. Ask grounded
            questions. Every answer cites the exact passages it came from.
          </p>
        </header>

        {/* Main grid */}
        <div style={styles.grid}>
          {/* Left column */}
          <div style={styles.leftCol}>
            <PDFUpload onUploaded={handleUploaded} />

            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.cardLabel}>Your Documents</span>
                <span style={styles.cardCount}>{documents.length}</span>
              </div>
              <DocumentList
                documents={documents}
                selectedId={selected?.id}
                onSelect={setSelected}
                onDelete={handleDelete}
                loading={loadingDocs}
              />
            </div>
          </div>

          {/* Right column */}
          <div style={styles.chatPanel}>
            {selected ? (
              <ChatBox document={selected} />
            ) : (
              <EmptyChatState hasDocs={documents.length > 0} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyChatState({ hasDocs }) {
  const features = [
    {
      icon: MessageSquare,
      title: 'Ask anything',
      desc: 'Natural-language questions about financials and strategy.',
    },
    {
      icon: Quote,
      title: 'Cited sources',
      desc: 'Every answer shows the exact passages used.',
    },
    {
      icon: ShieldCheck,
      title: 'Private',
      desc: 'Documents are scoped to your account only.',
    },
  ];

  return (
    <div style={styles.emptyWrap}>
      <div style={styles.emptyIcon}>
        <FileSearch size={32} color="#ffffff" />
      </div>
      <h2 style={styles.emptyTitle}>
        {hasDocs ? 'Pick a document to start' : 'Drop a PDF to begin'}
      </h2>
      <p style={styles.emptySubtitle}>
        {hasDocs
          ? 'Select one of your uploaded documents on the left to start asking questions.'
          : 'Upload a financial PDF on the left. Once processed, you can ask anything about it.'}
      </p>

      <div style={styles.features}>
        {features.map((f) => (
          <div key={f.title} style={styles.featureCard}>
            <f.icon size={16} color="#d4d4d8" />
            <div style={styles.featureTitle}>{f.title}</div>
            <div style={styles.featureDesc}>{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: 'calc(100vh - 72px)',
    padding: '40px 24px',
  },
  container: {
    maxWidth: '1280px',
    margin: '0 auto',
  },

  // Header
  header: {
    marginBottom: '32px',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '999px',
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.04)',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: '#e4e4e7',
    marginBottom: '16px',
  },
  title: {
    fontSize: '36px',
    fontWeight: 800,
    color: '#ffffff',
    letterSpacing: '-0.02em',
    lineHeight: 1.2,
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#a1a1aa',
    lineHeight: 1.6,
    maxWidth: '600px',
    marginTop: '12px',
  },

  // Grid
  grid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 380px) minmax(0, 1fr)',
    gap: '24px',
    alignItems: 'start',
  },

  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    minWidth: 0,
  },

  // Cards
  card: {
    background: 'rgba(24,24,27,0.5)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  cardLabel: {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: '#a1a1aa',
  },
  cardCount: {
    fontSize: '11px',
    color: '#71717a',
  },

  // Chat panel
  chatPanel: {
    background: 'rgba(24,24,27,0.5)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    minHeight: '660px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minWidth: 0,
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
  },

  // Empty state
  emptyWrap: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '48px 32px',
  },
  emptyIcon: {
    width: '72px',
    height: '72px',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.04)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '24px',
  },
  emptyTitle: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#ffffff',
    margin: 0,
    marginBottom: '10px',
    lineHeight: 1.3,
  },
  emptySubtitle: {
    fontSize: '14px',
    color: '#a1a1aa',
    maxWidth: '440px',
    lineHeight: 1.6,
    marginBottom: '32px',
  },
  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0,1fr))',
    gap: '12px',
    width: '100%',
    maxWidth: '600px',
  },
  featureCard: {
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '10px',
    padding: '16px',
    textAlign: 'left',
  },
  featureTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#ffffff',
    marginTop: '8px',
    marginBottom: '4px',
  },
  featureDesc: {
    fontSize: '11px',
    color: '#71717a',
    lineHeight: 1.5,
  },
};

export default AIResearch;
