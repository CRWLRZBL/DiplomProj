import React, { useCallback, useEffect, useRef } from 'react';
import { Form } from 'react-bootstrap';

const MAX_ROWS = 8;

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  className?: string;
};

function resizeTextarea(el: HTMLTextAreaElement) {
  const style = getComputedStyle(el);
  const lineHeight = Number.parseFloat(style.lineHeight) || 22;
  const padding =
    Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom);
  const border =
    Number.parseFloat(style.borderTopWidth) + Number.parseFloat(style.borderBottomWidth);
  const maxHeight = lineHeight * MAX_ROWS + padding + border;

  el.style.height = '0';
  const next = Math.min(el.scrollHeight, maxHeight);
  el.style.height = `${next}px`;
  el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
}

const AutoGrowTextarea: React.FC<Props> = ({
  value,
  onChange,
  placeholder,
  maxLength,
  disabled,
  className,
}) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  const syncHeight = useCallback(() => {
    if (ref.current) resizeTextarea(ref.current);
  }, []);

  useEffect(() => {
    syncHeight();
  }, [value, syncHeight]);

  return (
    <Form.Control
      ref={ref}
      as="textarea"
      rows={1}
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      maxLength={maxLength}
      className={className}
      onChange={(e) => onChange(e.target.value)}
      onInput={syncHeight}
    />
  );
};

export default AutoGrowTextarea;
