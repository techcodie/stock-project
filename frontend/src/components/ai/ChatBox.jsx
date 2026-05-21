import { useEffect, useRef, useState } from 'react';
import { Send, Loader2, FileText, Sparkles } from 'lucide-react';
import api from '../../services/api';
import MessageBubble from './MessageBubble';

function ChatBox({ document }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    setMessages([]);
    setError('');
    setInput('');
  }, [document?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const sendMessage = async (e) => {
    e?.preventDefault();
    const question = input.trim();
    if (!question || sending || !document) return;

    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setInput('');
    setSending(true);
    setError('');

    try {
      const res = await api.post('/ai/chat', { documentId: document.id, question });
      if (res.data.success) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: res.data.data.answer,
            sources: res.data.data.sources,
          },
        ]);
      } else {
        setError(res.data.message || 'Failed to get answer.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get answer.');
    } finally {
      setSending(false);
    }
  };

  const suggestions = [
    'Summarize the key financial highlights.',
    'What risks are mentioned in this document?',
    'What did management say about future growth?',
    'List the main business segments and their revenue.',
  ];

  return (
    <div style={styles.wrap}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerIcon}>
          <FileText size={18} color="#ffffff" />
        </div>
        <div style={styles.headerBody}>
          <div style={styles.headerLabel}>Asking about</div>
          <div style={styles.headerName} title={document.filename}>
            {document.filename}
          </div>
        </div>
        {document.pageCount > 0 && (
          <div style={styles.headerMeta}>
            <div style={styles.headerLabel}>Indexed</div>
            <div style={styles.headerMetaValue}>
              {document.pageCount} pages
              {document.chunkCount ? ` · ${document.chunkCount} chunks` : ''}
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={styles.messages}>
        {messages.length === 0 && (
          <div>
            <div style={styles.suggestionsLabel}>
              <Sparkles size={12} />
              <span>Suggested questions</span>
            </div>
            <div style={styles.suggestionsGrid}>
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setInput(s)}
                  style={styles.suggestion}
                >
                  <div style={styles.suggestionText}>{s}</div>
                  <div style={styles.suggestionHint}>Click to use</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <MessageBubble key={i} role={m.role} content={m.content} sources={m.sources} />
        ))}

        {sending && (
          <div style={styles.thinking}>
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            <span>Retrieving excerpts and composing an answer...</span>
          </div>
        )}

        {error && <div style={styles.errorBox}>{error}</div>}
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} style={styles.inputBar}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about this document..."
          style={styles.input}
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          style={{
            ...styles.sendBtn,
            background: sending || !input.trim() ? '#27272a' : '#ffffff',
            color: sending || !input.trim() ? '#71717a' : '#000000',
            cursor: sending || !input.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          <Send size={15} />
          Send
        </button>
      </form>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

const styles = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 0,
  },

  // Header
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '16px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.02)',
  },
  headerIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.04)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerBody: {
    flex: 1,
    minWidth: 0,
  },
  headerLabel: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: '#71717a',
    lineHeight: 1.4,
  },
  headerName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#ffffff',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    marginTop: '2px',
  },
  headerMeta: {
    textAlign: 'right',
    flexShrink: 0,
  },
  headerMetaValue: {
    fontSize: '12px',
    color: '#d4d4d8',
    fontWeight: 500,
    marginTop: '2px',
    whiteSpace: 'nowrap',
  },

  // Messages
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  suggestionsLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: '#a1a1aa',
    marginBottom: '14px',
  },
  suggestionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0,1fr))',
    gap: '10px',
  },
  suggestion: {
    textAlign: 'left',
    padding: '14px 16px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.02)',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontFamily: 'inherit',
  },
  suggestionText: {
    fontSize: '13px',
    lineHeight: 1.5,
    color: '#e4e4e7',
  },
  suggestionHint: {
    fontSize: '10px',
    color: '#71717a',
    marginTop: '6px',
  },
  thinking: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#a1a1aa',
  },
  errorBox: {
    fontSize: '12px',
    color: '#fecdd3',
    background: 'rgba(244,63,94,0.08)',
    border: '1px solid rgba(244,63,94,0.3)',
    borderRadius: '8px',
    padding: '10px 12px',
    lineHeight: 1.5,
  },

  // Input bar
  inputBar: {
    display: 'flex',
    gap: '10px',
    padding: '14px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.02)',
  },
  input: {
    flex: 1,
    background: 'rgba(0,0,0,0.4)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '13px',
    color: '#ffffff',
    outline: 'none',
    fontFamily: 'inherit',
  },
  sendBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 18px',
    borderRadius: '10px',
    border: 'none',
    fontSize: '13px',
    fontWeight: 600,
    transition: 'background 0.15s ease',
    fontFamily: 'inherit',
  },
};

export default ChatBox;
