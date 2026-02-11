/**
 * Tests for HumanChatInput keyboard handling
 * CVAULT-245: Fix Shift+Enter newline handling
 */

import { describe, it, expect, vi } from 'vitest';

// Mock the handleKeyDown logic from HumanChatInput.tsx
const createHandleKeyDown = (handleSubmit: (e: any) => void) => {
  return (e: { key: string; shiftKey: boolean; preventDefault: () => void }) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Allow Shift+Enter to insert newline - do not prevent default
        // The textarea's default behavior will handle the newline insertion
        return;
      } else {
        // Enter alone submits the form
        e.preventDefault();
        handleSubmit(e);
      }
    }
  };
};

describe('HumanChatInput Keyboard Handling', () => {
  describe('CVAULT-245: Shift+Enter newline handling', () => {
    it('should NOT call preventDefault when Shift+Enter is pressed', () => {
      const handleSubmit = vi.fn();
      const handleKeyDown = createHandleKeyDown(handleSubmit);
      
      const mockEvent = {
        key: 'Enter',
        shiftKey: true,
        preventDefault: vi.fn(),
      };
      
      handleKeyDown(mockEvent);
      
      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
      expect(handleSubmit).not.toHaveBeenCalled();
    });

    it('should call preventDefault and handleSubmit when Enter alone is pressed', () => {
      const handleSubmit = vi.fn();
      const handleKeyDown = createHandleKeyDown(handleSubmit);
      
      const mockEvent = {
        key: 'Enter',
        shiftKey: false,
        preventDefault: vi.fn(),
      };
      
      handleKeyDown(mockEvent);
      
      expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1);
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    it('should not handle non-Enter keys', () => {
      const handleSubmit = vi.fn();
      const handleKeyDown = createHandleKeyDown(handleSubmit);
      
      const mockEvent = {
        key: 'Escape',
        shiftKey: false,
        preventDefault: vi.fn(),
      };
      
      handleKeyDown(mockEvent);
      
      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
      expect(handleSubmit).not.toHaveBeenCalled();
    });

    it('should not handle other keys even with Shift pressed', () => {
      const handleSubmit = vi.fn();
      const handleKeyDown = createHandleKeyDown(handleSubmit);
      
      const mockEvent = {
        key: 'Tab',
        shiftKey: true,
        preventDefault: vi.fn(),
      };
      
      handleKeyDown(mockEvent);
      
      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
      expect(handleSubmit).not.toHaveBeenCalled();
    });
  });
});
