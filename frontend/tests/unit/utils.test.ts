import { describe, it, expect } from 'vitest';
import { formatDuration } from '../../utils';

describe('Utils - Unit Tests', () => {
  describe('formatDuration', () => {
    it('should format duration in seconds correctly', () => {
      expect(formatDuration(30)).toBe('30s');
      expect(formatDuration(60)).toBe('1m');
      expect(formatDuration(120)).toBe('2m');
    });

    it('should format duration in hours correctly', () => {
      expect(formatDuration(3600)).toBe('1h');
      expect(formatDuration(7200)).toBe('2h');
      expect(formatDuration(5400)).toBe('1h 30m');
    });

    it('should handle zero duration', () => {
      expect(formatDuration(0)).toBe('0s');
    });

    it('should handle negative duration', () => {
      expect(formatDuration(-10)).toBe('N/A');
    });

    it('should handle NaN', () => {
      expect(formatDuration(NaN)).toBe('N/A');
    });
  });
});

