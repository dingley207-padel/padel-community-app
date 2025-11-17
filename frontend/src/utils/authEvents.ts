// Simple event emitter for auth-related events
type AuthEventListener = () => void;

class AuthEvents {
  private listeners: Set<AuthEventListener> = new Set();

  // Subscribe to unauthorized events
  onUnauthorized(listener: AuthEventListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Emit unauthorized event (called from API interceptor)
  emitUnauthorized() {
    this.listeners.forEach(listener => listener());
  }
}

export const authEvents = new AuthEvents();
