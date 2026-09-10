/**
 * WebRTCManager — manages peer connections for audio, camera video, and screen sharing.
 *
 * Architecture: Mesh P2P topology.
 * Audio & Video streams flow peer-to-peer. Socket.IO carries signaling & track states.
 *
 * STUN: public IPs / NAT traversal.
 * TURN: relay fallback when direct P2P is blocked.
 */

import type { Socket } from 'socket.io-client'

export interface PeerState {
  userId: string
  connection: RTCPeerConnection
  audioElement: HTMLAudioElement
  videoSender: RTCRtpSender | null
  connectionState: RTCPeerConnectionState
}

type SpeakingCallback = (userId: string, speaking: boolean) => void
type ConnectionStateCallback = (userId: string, state: RTCPeerConnectionState) => void
type RemoteStreamCallback = (userId: string, stream: MediaStream) => void
type RemoteStreamRemovedCallback = (userId: string) => void

export class WebRTCManager {
  private peers = new Map<string, PeerState>()
  private localAudioStream: MediaStream | null = null
  private localCameraTrack: MediaStreamTrack | null = null
  private screenTrack: MediaStreamTrack | null = null

  private socket: Socket
  private huddleId: string
  private myUserId: string
  private iceServers: RTCIceServer[]
  private onSpeakingChange: SpeakingCallback
  private onConnectionStateChange: ConnectionStateCallback
  private onRemoteStream: RemoteStreamCallback
  private onRemoteStreamRemoved: RemoteStreamRemovedCallback
  private remoteStreams = new Map<string, MediaStream>()

  private audioContext: AudioContext | null = null
  private localSpeakingInterval: ReturnType<typeof setInterval> | null = null

  constructor(opts: {
    socket: Socket
    huddleId: string
    myUserId: string
    iceServers: RTCIceServer[]
    onSpeakingChange: SpeakingCallback
    onConnectionStateChange: ConnectionStateCallback
    onRemoteStream: RemoteStreamCallback
    onRemoteStreamRemoved: RemoteStreamRemovedCallback
  }) {
    this.socket = opts.socket
    this.huddleId = opts.huddleId
    this.myUserId = opts.myUserId
    this.iceServers = opts.iceServers
    this.onSpeakingChange = opts.onSpeakingChange
    this.onConnectionStateChange = opts.onConnectionStateChange
    this.onRemoteStream = opts.onRemoteStream
    this.onRemoteStreamRemoved = opts.onRemoteStreamRemoved
  }

  updateHuddleId(id: string) {
    this.huddleId = id
  }

  updateMyUserId(id: string) {
    this.myUserId = id
  }

  async acquireLocalStream(): Promise<MediaStream> {
    if (this.localAudioStream) return this.localAudioStream
    try {
      this.localAudioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      this.setupLocalVoiceActivity()
      return this.localAudioStream
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        throw new Error('Microphone permission was denied. Please allow microphone access to join.')
      }
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        throw new Error('No microphone found. Please connect a microphone and try again.')
      }
      if (err.name === 'NotReadableError') {
        throw new Error('Could not access your microphone. It may be in use by another app.')
      }
      throw new Error('Could not access your microphone: ' + (err.message || 'Unknown error'))
    }
  }

  private setupLocalVoiceActivity() {
    if (!this.localAudioStream) return
    try {
      this.audioContext = new AudioContext()
      const source = this.audioContext.createMediaStreamSource(this.localAudioStream)
      const analyser = this.audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      let isSpeaking = false
      let silenceCount = 0
      const THRESHOLD = 12
      const SILENCE_FRAMES = 6

      this.localSpeakingInterval = setInterval(() => {
        analyser.getByteFrequencyData(dataArray)
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
        if (avg > THRESHOLD) {
          silenceCount = 0
          if (!isSpeaking) {
            isSpeaking = true
            this.onSpeakingChange(this.myUserId, true)
          }
        } else {
          silenceCount++
          if (isSpeaking && silenceCount > SILENCE_FRAMES) {
            isSpeaking = false
            this.onSpeakingChange(this.myUserId, false)
          }
        }
      }, 100)
    } catch (e) {
      console.warn('[WebRTC] Voice activity detection unavailable:', e)
    }
  }

  /** Current active local video track (screen share takes priority over camera) */
  getActiveVideoTrack(): MediaStreamTrack | null {
    return this.screenTrack ?? this.localCameraTrack ?? null
  }

  async enableCamera(): Promise<MediaStreamTrack> {
    if (this.localCameraTrack && this.localCameraTrack.readyState === 'live') {
      return this.localCameraTrack
    }
    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true })
      const track = cameraStream.getVideoTracks()[0]
      this.localCameraTrack = track

      // If not currently screen sharing, send camera track to peers
      if (!this.screenTrack) {
        this.updateOutgoingVideoTrack(track)
      }
      return track
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        throw new Error('Camera permission was denied. Please allow camera access.')
      }
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        throw new Error('No camera found. Please connect a camera and try again.')
      }
      throw new Error('Could not access camera: ' + (err.message || 'Unknown error'))
    }
  }

  disableCamera() {
    if (this.localCameraTrack) {
      this.localCameraTrack.stop()
      this.localCameraTrack = null
    }
    if (!this.screenTrack) {
      this.updateOutgoingVideoTrack(null)
    }
  }

  async startScreenShare(onEnded: () => void): Promise<MediaStreamTrack> {
    if (this.screenTrack && this.screenTrack.readyState === 'live') {
      return this.screenTrack
    }
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
      const track = displayStream.getVideoTracks()[0]
      this.screenTrack = track

      track.onended = () => {
        this.stopScreenShare()
        onEnded()
      }

      this.updateOutgoingVideoTrack(track)
      return track
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        throw new Error('Screen sharing permission was denied.')
      }
      throw new Error('Could not start screen sharing: ' + (err.message || 'Unknown error'))
    }
  }

  stopScreenShare() {
    if (this.screenTrack) {
      this.screenTrack.onended = null
      this.screenTrack.stop()
      this.screenTrack = null
    }
    // Restore camera if active, otherwise set null
    const fallbackTrack = this.localCameraTrack && this.localCameraTrack.readyState === 'live' ? this.localCameraTrack : null
    this.updateOutgoingVideoTrack(fallbackTrack)
  }

  /** Update video track on all peer connections */
  private updateOutgoingVideoTrack(newTrack: MediaStreamTrack | null) {
    this.peers.forEach(peer => {
      if (peer.videoSender) {
        peer.videoSender.replaceTrack(newTrack).catch(err => {
          console.warn('[WebRTC] replaceTrack failed for peer ' + peer.userId, err)
        })
      } else if (newTrack && peer.connection.signalingState !== 'closed') {
        try {
          const sender = peer.connection.addTrack(newTrack, this.localAudioStream!)
          peer.videoSender = sender
        } catch (e) {
          console.warn('[WebRTC] addTrack failed for peer ' + peer.userId, e)
        }
      }
    })
  }

  private buildPeerConnection(remoteUserId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: this.iceServers })
    let videoSender: RTCRtpSender | null = null

    // Add audio track
    if (this.localAudioStream) {
      this.localAudioStream.getAudioTracks().forEach(track => {
        pc.addTrack(track, this.localAudioStream!)
      })
    }

    // Add active video track (or add dummy transceivers so replaceTrack works seamlessly)
    const activeVideoTrack = this.getActiveVideoTrack()
    if (activeVideoTrack) {
      videoSender = pc.addTrack(activeVideoTrack, this.localAudioStream!)
    } else {
      try {
        const transceiver = pc.addTransceiver('video', { direction: 'sendrecv' })
        videoSender = transceiver.sender
      } catch (e) {
        // Fallback for browsers that don't support addTransceiver
      }
    }

    const audio = new Audio()
    audio.autoplay = true
    audio.setAttribute('playsinline', 'true')

    pc.ontrack = (event) => {
      console.info('[WebRTC] ontrack from ' + remoteUserId + ' type: ' + event.track.kind)
      let stream = this.remoteStreams.get(remoteUserId)
      if (!stream) {
        stream = new MediaStream()
        this.remoteStreams.set(remoteUserId, stream)
      }

      // Add track to stream if not present
      if (!stream.getTracks().some(t => t.id === event.track.id)) {
        stream.addTrack(event.track)
      }

      if (event.track.kind === 'audio') {
        audio.srcObject = stream
        audio.play().catch(e => console.warn('[WebRTC] Autoplay blocked for ' + remoteUserId, e))
      }

      this.onRemoteStream(remoteUserId, stream)
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('webrtc:ice-candidate', {
          huddleId: this.huddleId,
          targetUserId: remoteUserId,
          candidate: event.candidate.toJSON()
        })
      }
    }

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState
      console.info('[WebRTC] Peer ' + remoteUserId + ' state: ' + state)
      const peer = this.peers.get(remoteUserId)
      if (peer) peer.connectionState = state
      this.onConnectionStateChange(remoteUserId, state)

      if (state === 'failed') {
        console.warn('[WebRTC] Connection to ' + remoteUserId + ' failed — closing')
        this.closePeer(remoteUserId)
      }
    }

    this.peers.set(remoteUserId, {
      userId: remoteUserId,
      connection: pc,
      audioElement: audio,
      videoSender,
      connectionState: 'new'
    })
    return pc
  }

  /** Initiate offer to an existing participant */
  async createOffer(remoteUserId: string): Promise<void> {
    const pc = this.buildPeerConnection(remoteUserId)
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    this.socket.emit('webrtc:offer', {
      huddleId: this.huddleId,
      targetUserId: remoteUserId,
      offer: pc.localDescription
    })
    console.info('[WebRTC] Sent offer to ' + remoteUserId)
  }

  /** Receive offer, create answer */
  async handleOffer(fromUserId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    let peer = this.peers.get(fromUserId)
    const pc = peer ? peer.connection : this.buildPeerConnection(fromUserId)

    await pc.setRemoteDescription(new RTCSessionDescription(offer))
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    this.socket.emit('webrtc:answer', {
      huddleId: this.huddleId,
      targetUserId: fromUserId,
      answer: pc.localDescription
    })
    console.info('[WebRTC] Sent answer to ' + fromUserId)
  }

  /** Receive answer to our offer */
  async handleAnswer(fromUserId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const peer = this.peers.get(fromUserId)
    if (!peer) {
      console.warn('[WebRTC] handleAnswer: no peer for ' + fromUserId)
      return
    }
    await peer.connection.setRemoteDescription(new RTCSessionDescription(answer))
  }

  /** Receive ICE candidate from remote peer */
  async handleIceCandidate(fromUserId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const peer = this.peers.get(fromUserId)
    if (!peer) return
    try {
      await peer.connection.addIceCandidate(new RTCIceCandidate(candidate))
    } catch (e) {
      console.warn('[WebRTC] Failed to add ICE candidate:', e)
    }
  }

  setMuted(muted: boolean) {
    if (!this.localAudioStream) return
    this.localAudioStream.getAudioTracks().forEach(track => { track.enabled = !muted })
  }

  closePeer(userId: string) {
    const peer = this.peers.get(userId)
    if (!peer) return
    peer.connection.close()
    peer.audioElement.srcObject = null
    this.peers.delete(userId)
    this.remoteStreams.delete(userId)
    this.onRemoteStreamRemoved(userId)
  }

  closeAll() {
    if (this.localSpeakingInterval) {
      clearInterval(this.localSpeakingInterval)
      this.localSpeakingInterval = null
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {})
      this.audioContext = null
    }
    if (this.screenTrack) {
      this.screenTrack.onended = null
      this.screenTrack.stop()
      this.screenTrack = null
    }
    if (this.localCameraTrack) {
      this.localCameraTrack.stop()
      this.localCameraTrack = null
    }
    if (this.localAudioStream) {
      this.localAudioStream.getTracks().forEach(t => t.stop())
      this.localAudioStream = null
    }
    for (const userId of this.peers.keys()) {
      this.closePeer(userId)
    }
    this.peers.clear()
    this.remoteStreams.clear()
    console.info('[WebRTC] Closed all peer connections and released camera/microphone')
  }
}
