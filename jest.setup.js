// Import jest-dom for custom matchers
require('@testing-library/jest-dom')

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock animation properties/methods needed for DOM testing
window.AnimationEvent = window.AnimationEvent || function () {}
window.TransitionEvent = window.TransitionEvent || function () {}
window.WebkitAnimation = {}

// Mock fetch API
global.fetch = jest.fn()

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks()
})

// Suppress specific console errors from React that are expected
const originalError = console.error
console.error = (...args) => {
  if (
    /Warning.*not wrapped in act/.test(args[0]) ||
    /Warning.*ReactDOM.render is no longer supported/.test(args[0])
  ) {
    return
  }
  originalError.call(console, ...args)
}
