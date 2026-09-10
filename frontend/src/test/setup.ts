import '@testing-library/jest-dom'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})

// Mock HTMLMediaElement & WebRTC APIs for Vitest jsdom environment
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

if (typeof window.navigator.mediaDevices === 'undefined') {
  Object.defineProperty(window.navigator, 'mediaDevices', {
    writable: true,
    value: {
      getUserMedia: async () => ({
        getTracks: () => [{ stop: () => {} }],
        getAudioTracks: () => [{ enabled: true, stop: () => {} }],
        getVideoTracks: () => [{ enabled: true, stop: () => {} }],
      }),
      getDisplayMedia: async () => ({
        getTracks: () => [{ stop: () => {} }],
        getVideoTracks: () => [{ enabled: true, stop: () => {}, onended: null }],
      }),
    },
  })
}
