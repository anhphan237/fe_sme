import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { server } from "./server";

// antd Drawer, Table, virtual list use ResizeObserver — not available in jsdom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// antd v5 + @ant-design/cssinjs generate CSS selectors (e.g. containing Tailwind
// class names as element selectors) that jsdom's nwsapi cannot parse.
// Patching querySelector/querySelectorAll to swallow the SyntaxError prevents
// React from catching and re-throwing it as an uncaught error.
const _origQS = Element.prototype.querySelector;
const _origQSA = Element.prototype.querySelectorAll;
Element.prototype.querySelector = function (selector: string) {
  try {
    return _origQS.call(this, selector);
  } catch {
    return null;
  }
};
Element.prototype.querySelectorAll = function (selector: string) {
  try {
    return _origQSA.call(this, selector);
  } catch {
    return document.createDocumentFragment().querySelectorAll("x");
  }
};

// antd uses window.matchMedia for responsive breakpoints — not available in jsdom
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Silence antd Drawer "width is deprecated" warning in test output
// Also silence jsdom's "Not implemented: window.getComputedStyle(elt, pseudoElt)"
const originalWarn = console.warn;
const originalError = console.error;
console.warn = (...args: unknown[]) => {
  if (typeof args[0] === "string" && args[0].includes("[antd:")) return;
  originalWarn(...args);
};
console.error = (...args: unknown[]) => {
  if (
    typeof args[0] === "string" &&
    args[0].includes("Not implemented: window.getComputedStyle")
  )
    return;
  originalError(...args);
};

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
