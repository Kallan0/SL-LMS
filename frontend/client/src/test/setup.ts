import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock window.location
delete (window as any).location;
window.location = { href: "/", assign: vi.fn(), replace: vi.fn() } as any;

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Object.defineProperty(window, "ResizeObserver", {
  value: ResizeObserverMock,
});

// Mock IntersectionObserver
class IntersectionObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Object.defineProperty(window, "IntersectionObserver", {
  value: IntersectionObserverMock,
});

// Mock requestAnimationFrame
Object.defineProperty(window, "requestAnimationFrame", {
  value: (cb: FrameRequestCallback) => setTimeout(cb, 0),
});

// Mock cancelAnimationFrame
Object.defineProperty(window, "cancelAnimationFrame", {
  value: (id: number) => clearTimeout(id),
});

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

// Suppress console.error in tests (optional, uncomment if needed)
// const originalError = console.error;
// beforeAll(() => {
//   console.error = (...args: any[]) => {
//     if (typeof args[0] === 'string' && args[0].includes('Warning:')) return;
//     originalError.call(console, ...args);
//   };
// });
// afterAll(() => {
//   console.error = originalError;
// });
