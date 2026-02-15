import { TimeTrackingComponent } from './time-tracking.component';

describe('TimeTrackingComponent', () => {
  let component: TimeTrackingComponent;

  beforeEach(() => {
    // Create a plain instance for pure method testing
    component = Object.create(TimeTrackingComponent.prototype);
  });

  describe('getFormattedTime', () => {
    it('should format 0 seconds as 00:00:00', () => {
      expect(component.getFormattedTime(0)).toBe('00:00:00');
    });

    it('should format less than 10 seconds with leading zeros', () => {
      expect(component.getFormattedTime(7)).toBe('00:00:07');
    });

    it('should format under one minute', () => {
      expect(component.getFormattedTime(59)).toBe('00:00:59');
    });

    it('should format exactly one minute', () => {
      expect(component.getFormattedTime(60)).toBe('00:01:00');
    });

    it('should format minutes and seconds', () => {
      expect(component.getFormattedTime(125)).toBe('00:02:05');
    });

    it('should format hours, minutes, and seconds', () => {
      expect(component.getFormattedTime(3661)).toBe('01:01:01');
    });

    it('should format large number of seconds', () => {
      expect(component.getFormattedTime(7322)).toBe('02:02:02');
    });

    it('should return 00:00:00 for NaN input', () => {
      expect(component.getFormattedTime(NaN)).toBe('00:00:00');
    });

    it('should handle string input convertible to number', () => {
      expect(component.getFormattedTime('90' as any)).toBe('00:01:30');
    });

    it('should return 00:00:00 for string input not convertible to number', () => {
      expect(component.getFormattedTime('abc' as any)).toBe('00:00:00');
    });
  });

  describe('formatDuration', () => {
    // Access private method for testing
    const getFormatDuration = (comp: any) => comp['formatDuration'].bind(comp);// Use bind to maintain context 

    it('should format less than one minute as Xs', () => {
      expect(getFormatDuration(component)(45)).toBe('45s');
    });

    it('should format less than an hour as Xm Ys', () => {
      expect(getFormatDuration(component)(125)).toBe('2m 5s');
    });

    it('should format an exact minute as Xm 0s', () => {
      expect(getFormatDuration(component)(120)).toBe('2m 0s');
    });

    it('should format one hour as Xh 0m 0s', () => {
      expect(getFormatDuration(component)(3600)).toBe('1h 0m 0s');
    });

    it('should format hours, minutes, and seconds correctly', () => {
      expect(getFormatDuration(component)(3723)).toBe('1h 2m 3s');
    });

    it('should format zero seconds as 0s', () => {
      expect(getFormatDuration(component)(0)).toBe('0s');
    });
  });
});