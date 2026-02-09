import { useEffect, RefObject } from 'react';

/**
 * Custom hook to trap focus within a DOM element
 * Ensures keyboard navigation stays within the modal/dialog
 *
 * @param ref - Reference to the container element
 * @param isActive - Whether the focus trap is active
 * @param onClose - Optional callback when Escape is pressed
 */
export function useFocusTrap(
  ref: RefObject<HTMLElement>,
  isActive: boolean,
  onClose?: () => void
) {
  useEffect(() => {
    if (!isActive || !ref.current) return;

    const container = ref.current;

    // Get all focusable elements within the container
    const getFocusableElements = () => {
      const focusableSelectors = [
        'button:not([disabled])',
        '[href]',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ');

      return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));
    };

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // If shift+tab on first element, move to last
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
      // If tab on last element, move to first
      else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    // Focus the first element when trap activates
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      // Small delay to ensure the modal is fully rendered
      setTimeout(() => {
        focusableElements[0]?.focus();
      }, 100);
    }

    document.addEventListener('keydown', handleTab);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleTab);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [ref, isActive, onClose]);
}

/**
 * Custom hook to manage focus restoration
 * Stores the element that had focus before a modal opens and restores it when closed
 */
export function useFocusRestore(isActive: boolean) {
  useEffect(() => {
    if (!isActive) return;

    // Store the currently focused element
    const previousActiveElement = document.activeElement as HTMLElement;

    return () => {
      // Restore focus when the component unmounts or becomes inactive
      if (previousActiveElement && document.contains(previousActiveElement)) {
        previousActiveElement.focus();
      }
    };
  }, [isActive]);
}
