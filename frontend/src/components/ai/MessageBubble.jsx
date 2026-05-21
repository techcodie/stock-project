import { useState } from 'react';
import { Bot, User, ChevronDown, ChevronUp, Quote } from 'lucide-react';

function MessageBubble({ role, content, sources }) {
  const [showSources, setShowSources] = useState(false);
  const isUser = role === 'user';

  return (
    <div
      style={{
        display: 'flex',
        gap: '10px',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
      }}
    >
      {!isUser && (
        <div style={styles.avatar}>
          <Bot size={14} color="#ffffff" />
        </div>
      )}

      <div style={{ maxWidth: '80%', minWidth: 0, order: isUser ? -1 : 0 }}>
        <div
          style={{
            ...styles.bubble,
            ...(isUser ? styles.bubbleUser : styles.bubbleAssistant),
          }}
        >
          {content}
        </div>

        {!isUser && sources && sources.length > 0 && (
          <button
            type="button"
            onClick={() => setShowSources((v) => !v)}
            style={styles.sourceToggle}
          >
            {showSources ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            <span>
              {showSources ? 'Hide' : 'Show'} {sources.length} source
              {sources.length > 1 ? 's' : ''}
            </span>
          </button>
        )}

        {!isUser && showSources && (
          <div style={styles.sourcesWrap}>
            {sources.map((s, idx) => (
              <div key={idx} style={styles.source}>
                <div style={styles.sourceHeader}>
                  <div style={styles.sourceLabel}>
                    <Quote size={11} />
                    <span style={{ fontWeight: 600, color: '#d4d4d8' }}>
                      Source {idx + 1}
                    </span>
                    <span style={{ color: '#71717a' }}>· chunk #{s.chunkIndex}</span>
                  </div>
                  {typeof s.similarity === 'number' && (
                    <span style={styles.similarity}>
                      {(s.similarity * 100).toFixed(0)}% match
                    </span>
                  )}
                </div>
                <p style={styles.sourceText}>{s.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {isUser && (
        <div style={{ ...styles.avatar, background: 'rgba(255,255,255,0.12)' }}>
          <User size={14} color="#ffffff" />
        </div>
      )}
    </div>
  );
}

const styles = {
  avatar: {
    width: '30px',
    height: '30px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: '4px',
  },
  bubble: {
    borderRadius: '14px',
    padding: '10px 14px',
    fontSize: '13.5px',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  bubbleUser: {
    background: '#ffffff',
    color: '#000000',
    fontWeight: 500,
    borderBottomRightRadius: '4px',
  },
  bubbleAssistant: {
    background: 'rgba(255,255,255,0.04)',
    color: '#f4f4f5',
    border: '1px solid rgba(255,255,255,0.08)',
    borderBottomLeftRadius: '4px',
  },
  sourceToggle: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: '8px',
    background: 'transparent',
    border: 'none',
    color: '#71717a',
    fontSize: '11px',
    cursor: 'pointer',
    padding: 0,
    fontFamily: 'inherit',
  },
  sourcesWrap: {
    marginTop: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  source: {
    padding: '12px',
    borderRadius: '10px',
    background: 'rgba(0,0,0,0.4)',
    border: '1px solid rgba(255,255,255,0.08)',
    fontSize: '11.5px',
    color: '#d4d4d8',
    lineHeight: 1.6,
  },
  sourceHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    marginBottom: '8px',
  },
  sourceLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    color: '#a1a1aa',
  },
  similarity: {
    fontSize: '11px',
    color: '#34d399',
    fontWeight: 500,
  },
  sourceText: {
    margin: 0,
    color: '#d4d4d8',
  },
};

export default MessageBubble;
