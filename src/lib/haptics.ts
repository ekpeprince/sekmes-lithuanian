// Mobile Native Haptic Vibration Feedback System for Sėkmės!

class HapticManager {
  private enabled: boolean = true;

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  private vibrate(pattern: number | number[]): void {
    if (!this.enabled || typeof window === 'undefined') return;
    try {
      if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
        navigator.vibrate(pattern);
      }
    } catch {
      // Ignore vibration error on non-vibrating devices (e.g. desktop)
    }
  }

  // Light tactile tick: UI taps, word bank selections, card flips
  public tap(): void {
    this.vibrate(15);
  }

  // Crisp double-pulse: Correct answer, quest completion
  public success(): void {
    this.vibrate([40, 50, 40]);
  }

  // Warning pulse: Wrong answer, heart lost
  public error(): void {
    this.vibrate([90, 60, 120]);
  }

  // Triumphant celebration: Lesson complete, Duel victory, Mystery chest
  public victory(): void {
    this.vibrate([50, 70, 50, 70, 120, 80, 200]);
  }

  // Urgency tick: Last 3 seconds of round timer in Battle or Speed Drill
  public warningTick(): void {
    this.vibrate(30);
  }

  // Duel Alert buzz: Incoming duel invite or friend joined
  public duelAlert(): void {
    this.vibrate([80, 80, 80, 80, 150]);
  }
}

export const haptics = new HapticManager();
