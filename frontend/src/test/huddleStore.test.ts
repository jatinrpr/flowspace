import { describe, it, expect, beforeEach } from 'vitest'
import { useHuddleStore } from '../store/huddleStore'

describe('huddleStore Zustand State Tests', () => {
  beforeEach(() => {
    useHuddleStore.setState({
      activeHuddle: null,
      isJoined: false,
      isMuted: false,
      isSpeaking: false,
      cameraEnabled: false,
      screenSharing: false,
      huddleIndicators: {},
    })
  })

  it('should initialize with default audio/video state', () => {
    const state = useHuddleStore.getState()
    expect(state.activeHuddle).toBeNull()
    expect(state.isMuted).toBe(false)
    expect(state.cameraEnabled).toBe(false)
    expect(state.screenSharing).toBe(false)
  })

  it('should update mute and camera state flags', () => {
    useHuddleStore.setState({ isMuted: true, cameraEnabled: true })

    const state = useHuddleStore.getState()
    expect(state.isMuted).toBe(true)
    expect(state.cameraEnabled).toBe(true)
  })
})
