import { useRef, useEffect, useLayoutEffect, useCallback, useState, ReactNode, MouseEvent as ReactMouseEvent } from 'react';
import { createPortal } from 'react-dom';

interface DropdownMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  button: ReactNode;
  children: ReactNode;
  width?: number;
}

export default function DropdownMenu({ isOpen, onToggle, button, children, width = 192 }: DropdownMenuProps) {
  const btnRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<React.CSSProperties | null>(null);

  const computePosition = useCallback((): React.CSSProperties | null => {
    if (!btnRef.current) return null;
    const rect = btnRef.current.getBoundingClientRect();
    // Button hidden (display:none via responsive CSS) → don't show menu
    if (rect.width === 0 && rect.height === 0) return null;

    const spaceBelow = window.innerHeight - rect.bottom;

    let left = rect.right - width;
    if (left < 8) left = 8;
    if (left + width > window.innerWidth - 8) {
      left = window.innerWidth - width - 8;
    }

    const css: React.CSSProperties = { position: 'fixed', left, width, zIndex: 9999 };

    if (spaceBelow >= 200) {
      css.top = rect.bottom + 4;
    } else {
      css.bottom = window.innerHeight - rect.top + 4;
    }

    return css;
  }, [width]);

  // Calculate position before paint
  useLayoutEffect(() => {
    if (isOpen) {
      setPos(computePosition());
    } else {
      setPos(null);
    }
  }, [isOpen, computePosition]);

  // Close on outside click — use 'click' instead of 'mousedown' to avoid
  // intercepting clicks on menu items before their handlers fire
  useEffect(() => {
    if (!isOpen || !pos) return;
    const handler = (e: globalThis.MouseEvent) => {
      const target = e.target as Node;
      if (btnRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      onToggle();
    };
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, [isOpen, pos, onToggle]);

  // Close on scroll
  useEffect(() => {
    if (!isOpen) return;
    const handler = () => onToggle();
    window.addEventListener('scroll', handler, true);
    return () => window.removeEventListener('scroll', handler, true);
  }, [isOpen, onToggle]);

  const handleBtnClick = (e: ReactMouseEvent) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    onToggle();
  };

  // Don't render the portal until position is computed
  const showPortal = isOpen && pos !== null;

  return (
    <>
      <div ref={btnRef} className="inline-flex" onClick={handleBtnClick}>
        {button}
      </div>
      {showPortal && createPortal(
        <div
          ref={menuRef}
          className="bg-white rounded-xl shadow-2xl border border-gray-200 py-1 overflow-hidden"
          style={pos!}
        >
          {children}
        </div>,
        document.body
      )}
    </>
  );
}
