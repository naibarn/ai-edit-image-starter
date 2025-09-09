/// <reference types="vitest/globals" />
import '@testing-library/jest-dom'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/edit'
  },
}))

// Mock environment variables
process.env.NEXT_PUBLIC_API_BASE = 'http://localhost:8001'
process.env.NEXT_PUBLIC_USE_QUEUE = 'false'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})


// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
  takeRecords: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}))

// Mock fetch
global.fetch = vi.fn().mockImplementation(() =>
  Promise.resolve({
    json: () => Promise.resolve([]),
    text: () => Promise.resolve(''),
    ok: true,
    status: 200,
    statusText: 'OK',
  } as Response)
)

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mocked-url')
global.URL.revokeObjectURL = vi.fn()

// Mock PointerEvent for Radix UI
;(globalThis as any).PointerEvent ||= class PointerEvent extends MouseEvent {}

// Mock hasPointerCapture method for Radix UI
;(globalThis as any).HTMLElement.prototype.hasPointerCapture ||= () => false

// Mock scrollTo
;(window as any).scrollTo ||= () => {}

// Mock scrollIntoView for Radix UI
;(globalThis as any).HTMLElement.prototype.scrollIntoView ||= () => {}

// Mock setPointerCapture and releasePointerCapture for Radix UI
;(globalThis as any).HTMLElement.prototype.setPointerCapture ||= () => {}
;(globalThis as any).HTMLElement.prototype.releasePointerCapture ||= () => {}

// Mock getComputedStyle for Radix UI
;(window as any).getComputedStyle ||= (element: Element) => ({
  getPropertyValue: (prop: string) => {
    if (prop === 'position') return 'static'
    if (prop === 'display') return 'block'
    return ''
  }
})

// Mock Element methods for Radix UI
;(globalThis as any).Element.prototype.getBoundingClientRect ||= () => ({
  width: 100,
  height: 100,
  top: 0,
  left: 0,
  bottom: 100,
  right: 100,
  x: 0,
  y: 0,
  toJSON: () => ({}),
})

// Mock document.elementFromPoint for Radix UI
;(document as any).elementFromPoint ||= () => null

// Mock pointer events for Radix UI
;(globalThis as any).HTMLElement.prototype.hasPointerCapture ||= () => false
;(globalThis as any).HTMLElement.prototype.setPointerCapture ||= () => {}
;(globalThis as any).HTMLElement.prototype.releasePointerCapture ||= () => {}

// Mock ResizeObserver for Radix UI
;(globalThis as any).ResizeObserver ||= class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock IntersectionObserver for Radix UI
;(globalThis as any).IntersectionObserver ||= class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
  root = null
  rootMargin = ''
  thresholds = []
  takeRecords = () => []
}