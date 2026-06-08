import React, { useState } from 'react';
import { resolvePublicImageUrl } from '../../utils/catalogImage';

const ATTACHMENT_RE = /^📎\s*(.+?):\s*(.+)$/;

function isImageUrl(url: string): boolean {
  return /\.(jpe?g|png|webp|gif)(\?|$)/i.test(url);
}

function ChatAttachmentImage({ href, label }: { href: string; label: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="chat-attachment-failed mt-1">
        Не удалось показать изображение.{' '}
        <a href={href} target="_blank" rel="noopener noreferrer">
          Открыть файл
        </a>
      </div>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="d-inline-block mt-1">
      <img src={href} alt={label} loading="lazy" onError={() => setFailed(true)} />
    </a>
  );
}

type Props = {
  body: string;
};

const ChatMessageBody: React.FC<Props> = ({ body }) => {
  const lines = body.split('\n');

  return (
    <div className="chat-message-body mb-0">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return idx < lines.length - 1 ? <br key={idx} /> : null;
        }

        const match = trimmed.match(ATTACHMENT_RE);
        if (match) {
          const label = match[1].trim();
          const href = resolvePublicImageUrl(match[2].trim());
          if (isImageUrl(href)) {
            return (
              <div key={idx} className="chat-attachment mb-2">
                <div className="chat-attachment-label small mb-1">📎 {label}</div>
                <ChatAttachmentImage href={href} label={label} />
              </div>
            );
          }
          return (
            <div key={idx} className="mb-1">
              <a href={href} target="_blank" rel="noopener noreferrer">
                📎 {label}
              </a>
            </div>
          );
        }
        return (
          <span key={idx} style={{ whiteSpace: 'pre-wrap' }}>
            {idx > 0 && lines[idx - 1]?.trim() ? '\n' : ''}
            {line}
          </span>
        );
      })}
    </div>
  );
};

export default ChatMessageBody;
