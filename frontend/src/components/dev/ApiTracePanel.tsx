import { useApiTrace } from '../../hooks/v1/useApiTrace';
import { CopyButton } from '../v1/CopyButton';

export function ApiTraceDebugPanel() {
  const { history, pending, clearHistory } = useApiTrace({ maxHistory: 10 });

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{ position: 'fixed', bottom: 10, right: 10, width: 400, maxHeight: 400, overflowY: 'auto', background: '#111', color: '#0f0', padding: 10, borderRadius: 8, fontSize: 12, zIndex: 9999, border: '1px solid #333' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <h3 style={{ margin: 0, fontSize: 14 }}>📡 API Trace Diagnostics</h3>
        <div>
          <button onClick={clearHistory} style={{ background: '#333', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: 4, cursor: 'pointer', marginRight: 8 }}>Clear</button>
          <CopyButton text={JSON.stringify({ pending, history }, null, 2)} variant="text">Copy All Logs</CopyButton>
        </div>
      </div>
      
      <div style={{ marginBottom: 10 }}>
        <strong>Pending Requests ({pending.length}):</strong>
        {pending.map(p => (
          <div key={p.traceId} style={{ background: '#222', padding: 4, marginTop: 4, borderRadius: 2 }}>
            [{p.source}] {p.method} {p.url}
          </div>
        ))}
      </div>

      <div>
        <strong>History ({history.length}):</strong>
        {history.map(h => (
          <div key={h.traceId} style={{ background: '#222', padding: 4, marginTop: 4, borderRadius: 2, borderLeft: `3px solid ${h.status === 'success' ? '#0f0' : h.status === 'error' ? '#f00' : '#888'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>[{h.source}] {h.method}</span>
              <span>{h.status} ({h.durationMs}ms)</span>
            </div>
            <div style={{ wordBreak: 'break-all', opacity: 0.8, fontSize: 10 }}>{h.url}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
