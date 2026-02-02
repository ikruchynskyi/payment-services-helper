import React, { useEffect, useMemo, useState } from 'react';

function safeParseJson(text) {
  try {
    return { parsed: JSON.parse(text), raw: null };
  } catch (error) {
    return { parsed: null, raw: text };
  }
}

function buildCopyText(request) {
  if (!request?.request) return '';
  const lines = [`URL: ${request.request.url}, Method: ${request.request.method}`];
  if (request.response) {
    lines.push(`${request.response.statusText}, Status: ${request.response.status}`);
    if (request.response.body) {
      const { parsed, raw } = safeParseJson(request.response.body);
      lines.push(parsed ? JSON.stringify(parsed, null, 2) : raw);
    }
  }
  return lines.filter(Boolean).join('\n');
}

function ResultsApp() {
  const [requests, setRequests] = useState(null);

  useEffect(() => {
    chrome.storage.local.get(['attachedIframes'], (result) => {
      const iframes = result.attachedIframes;
      if (iframes) {
        for (const iframeId of Object.keys(iframes)) {
          chrome.debugger.sendCommand({ targetId: iframeId }, 'Network.disable', () => {});
        }
      }
    });

    chrome.storage.local.get(['networkRequests'], (result) => {
      const stored = result.networkRequests;
      if (stored && Object.keys(stored).length > 0) {
        setRequests(stored);
      } else {
        setRequests({});
      }
    });
  }, []);

  const entries = useMemo(() => Object.entries(requests || {}), [requests]);

  if (!requests) {
    return <div className="heading">Loading...</div>;
  }

  if (entries.length === 0) {
    return (
      <div className="heading empty">
        <h2>No failed requests found. If Checkout was failed, please inspect Console and Network tab</h2>
      </div>
    );
  }

  return (
    <div className="results-wrapper">
      <div className="heading">
        <h2>Next requests failed during checkout and might be cause of the issue:</h2>
      </div>
      <div className="results">
        {entries.map(([requestId, request]) => {
          const copyText = buildCopyText(request);
          const parsedBody = request.response?.body ? safeParseJson(request.response.body) : null;
          return (
            <button
              key={requestId}
              className="request-card"
              title="COPY"
              onClick={() => {
                navigator.clipboard.writeText(copyText);
                const encodedText = encodeURIComponent(copyText);
                window.open(`https://www.perplexity.ai?q=${encodedText}`, '_blank');
              }}
            >
              <div className="request-header">
                <div>URL: {request.request.url}</div>
                <div>Method: {request.request.method}</div>
              </div>
              {request.response && (
                <div className="request-status">
                  {request.response.statusText}, Status: {request.response.status}
                </div>
              )}
              {request.response?.body && (
                <pre>
                  {parsedBody?.parsed
                    ? JSON.stringify(parsedBody.parsed, null, 2)
                    : parsedBody?.raw}
                </pre>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ResultsApp;
