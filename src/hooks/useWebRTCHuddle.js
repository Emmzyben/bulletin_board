import { useEffect, useRef, useState, useCallback } from 'react';

// Free Google public STUN servers for standard NAT traversal
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

/**
 * useWebRTCHuddle
 * Handles:
 * 1. Hardware access (microphone, camera, screen share)
 * 2. Mesh peer-to-peer WebRTC connections (RTCPeerConnection) via Socket.io signaling
 * 3. Real-time Web Audio API voice activity detection (auto-speaking indicator)
 * 4. Multi-peer audio/video stream synchronization
 */
export function useWebRTCHuddle({ socket, channelId, user, active, onLeave }) {
  const [localStream, setLocalStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [peers, setPeers] = useState([]); // array of { socketId, userEmail, userName, stream, isSpeaking }
  const [mediaError, setMediaError] = useState(null);

  // References to keep state consistent across socket callbacks
  const peerConnectionsRef = useRef(new Map()); // socketId -> RTCPeerConnection
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const vadRafRef = useRef(null);
  const isMutedRef = useRef(false);
  const isSpeakingRef = useRef(false);

  isMutedRef.current = isMuted;

  // ── Helper to update a peer in state ──
  const updatePeer = useCallback((socketId, updater) => {
    setPeers(prev => {
      const idx = prev.findIndex(p => p.socketId === socketId);
      if (idx === -1) return prev;
      const copy = [...prev];
      copy[idx] = typeof updater === 'function' ? updater(copy[idx]) : { ...copy[idx], ...updater };
      return copy;
    });
  }, []);

  // ── Voice Activity Detection (VAD) via Web Audio API ──
  const setupVAD = useCallback((stream) => {
    try {
      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) return;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.3;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const buffer = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(buffer);

        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          sum += buffer[i];
        }
        const avg = sum / buffer.length;
        const speakingNow = !isMutedRef.current && avg > 14;

        if (speakingNow !== isSpeakingRef.current) {
          isSpeakingRef.current = speakingNow;
          setIsSpeaking(speakingNow);
          if (socket && channelId) {
            socket.emit('huddle:speak', { channelId, isSpeaking: speakingNow });
          }
        }

        vadRafRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (err) {
      console.warn('VAD AudioContext init failed:', err);
    }
  }, [socket, channelId]);

  const teardownVAD = useCallback(() => {
    if (vadRafRef.current) {
      cancelAnimationFrame(vadRafRef.current);
      vadRafRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {
        // ignore
      }
      audioContextRef.current = null;
    }
    isSpeakingRef.current = false;
    setIsSpeaking(false);
  }, []);

  // ── Create a peer connection for a remote socket ──
  const createPeerConnection = useCallback((remoteSocketId, peerInfo, isInitiator) => {
    if (peerConnectionsRef.current.has(remoteSocketId)) {
      return peerConnectionsRef.current.get(remoteSocketId);
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current.set(remoteSocketId, pc);

    // Add local tracks to this connection
    const streamToSend = screenStreamRef.current || localStreamRef.current;
    if (streamToSend) {
      streamToSend.getTracks().forEach(track => {
        pc.addTrack(track, streamToSend);
      });
    }

    // ICE Candidate generation
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('huddle:signal', {
          to: remoteSocketId,
          channelId,
          signal: 'ice-candidate',
          data: event.candidate,
        });
      }
    };

    // Remote Track received
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0] || new MediaStream([event.track]);
      setPeers(prev => {
        const existing = prev.find(p => p.socketId === remoteSocketId);
        if (existing) {
          return prev.map(p => (p.socketId === remoteSocketId ? { ...p, stream: remoteStream } : p));
        }
        return [
          ...prev,
          {
            socketId: remoteSocketId,
            userEmail: peerInfo?.userEmail,
            userName: peerInfo?.userName || peerInfo?.userEmail?.split('@')[0] || 'Teammate',
            stream: remoteStream,
            isSpeaking: false,
          },
        ];
      });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        // cleanup if needed
      }
    };

    // If initiator, create and send offer
    if (isInitiator) {
      pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
        .then(offer => pc.setLocalDescription(offer))
        .then(() => {
          if (socket) {
            socket.emit('huddle:signal', {
              to: remoteSocketId,
              channelId,
              signal: 'offer',
              data: pc.localDescription,
            });
          }
        })
        .catch(err => console.error('Error creating offer:', err));
    }

    return pc;
  }, [socket, channelId]);

  // ── Initialize Local Media and Join Huddle ──
  useEffect(() => {
    if (!active || !channelId || !socket) return;

    let isMounted = true;

    async function initMedia() {
      try {
        setMediaError(null);
        // Request microphone by default; video off initially
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        localStreamRef.current = stream;
        setLocalStream(stream);
        setIsMuted(false);
        setIsVideoOn(false);

        // Setup real-time voice activity detection
        setupVAD(stream);

        // Emit huddle join to backend
        socket.emit('huddle:join', { channelId });
      } catch (err) {
        console.error('Failed to get media devices:', err);
        setMediaError(err.message || 'Microphone access denied. Check browser permissions.');
        // Fallback: join without local media so user can still listen
        socket.emit('huddle:join', { channelId });
      }
    }

    initMedia();

    // ── Socket Event Handlers ──
    const handleExistingPeers = ({ peers: existingPeers }) => {
      // Connect to all existing peers in the room (we act as initiator)
      existingPeers.forEach(peer => {
        if (peer.socketId === socket.id) return;
        setPeers(prev => {
          if (prev.some(p => p.socketId === peer.socketId)) return prev;
          return [...prev, { ...peer, stream: null, isSpeaking: false }];
        });
        createPeerConnection(peer.socketId, peer, true);
      });
    };

    const handleUserJoined = (participant) => {
      setPeers(prev => {
        if (prev.some(p => p.socketId === participant.socketId)) return prev;
        return [...prev, { ...participant, stream: null, isSpeaking: false }];
      });
      // The joined user will receive existing_peers and initiate, or we wait for offer
    };

    const handleUserLeft = ({ socketId }) => {
      const pc = peerConnectionsRef.current.get(socketId);
      if (pc) {
        pc.close();
        peerConnectionsRef.current.delete(socketId);
      }
      setPeers(prev => prev.filter(p => p.socketId !== socketId));
    };

    const handleSpeakingChange = ({ socketId, userEmail, isSpeaking: peerSpeaking }) => {
      setPeers(prev => prev.map(p => {
        if (p.socketId === socketId || p.userEmail === userEmail) {
          return { ...p, isSpeaking: peerSpeaking };
        }
        return p;
      }));
    };

    const handleSignal = async ({ from, signal, data, fromUser, fromName }) => {
      let pc = peerConnectionsRef.current.get(from);
      if (!pc) {
        pc = createPeerConnection(from, { userEmail: fromUser, userName: fromName }, false);
      }

      try {
        if (signal === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(data));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('huddle:signal', {
            to: from,
            channelId,
            signal: 'answer',
            data: pc.localDescription,
          });
        } else if (signal === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(data));
        } else if (signal === 'ice-candidate') {
          if (data) {
            await pc.addIceCandidate(new RTCIceCandidate(data));
          }
        }
      } catch (err) {
        console.error('Error handling WebRTC signal:', signal, err);
      }
    };

    socket.on('huddle:existing_peers', handleExistingPeers);
    socket.on('huddle:user_joined', handleUserJoined);
    socket.on('huddle:user_left', handleUserLeft);
    socket.on('huddle:speaking_change', handleSpeakingChange);
    socket.on('huddle:signal', handleSignal);

    return () => {
      isMounted = false;
      // Leave huddle
      socket.emit('huddle:leave', { channelId });
      socket.off('huddle:existing_peers', handleExistingPeers);
      socket.off('huddle:user_joined', handleUserJoined);
      socket.off('huddle:user_left', handleUserLeft);
      socket.off('huddle:speaking_change', handleSpeakingChange);
      socket.off('huddle:signal', handleSignal);

      // Close all peer connections
      peerConnectionsRef.current.forEach(pc => pc.close());
      peerConnectionsRef.current.clear();

      // Stop local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
      }

      teardownVAD();
      setPeers([]);
      setLocalStream(null);
      setScreenStream(null);
      setIsScreenSharing(false);
      setIsVideoOn(false);
    };
  }, [active, channelId, socket, createPeerConnection, setupVAD, teardownVAD]);

  // ── Toggle Microphone (Mute / Unmute) ──
  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      const nextMuted = !audioTrack.enabled;
      setIsMuted(nextMuted);
      if (nextMuted && socket && channelId) {
        socket.emit('huddle:speak', { channelId, isSpeaking: false });
        setIsSpeaking(false);
      }
    }
  }, [socket, channelId]);

  // ── Toggle Video / Camera ──
  const toggleVideo = useCallback(async () => {
    try {
      if (isVideoOn) {
        // Turn off video
        if (localStreamRef.current) {
          const videoTrack = localStreamRef.current.getVideoTracks()[0];
          if (videoTrack) {
            videoTrack.stop();
            localStreamRef.current.removeTrack(videoTrack);
          }
        }
        setIsVideoOn(false);
        // Remove from all peer connections
        peerConnectionsRef.current.forEach(pc => {
          const senders = pc.getSenders();
          const videoSender = senders.find(s => s.track && s.track.kind === 'video');
          if (videoSender) pc.removeTrack(videoSender);
        });
      } else {
        // Request video stream
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = videoStream.getVideoTracks()[0];
        if (localStreamRef.current) {
          localStreamRef.current.addTrack(videoTrack);
        } else {
          localStreamRef.current = videoStream;
          setLocalStream(videoStream);
        }
        setIsVideoOn(true);

        // Add to peer connections or renegotiate
        peerConnectionsRef.current.forEach(pc => {
          pc.addTrack(videoTrack, localStreamRef.current);
          pc.createOffer()
            .then(offer => pc.setLocalDescription(offer))
            .then(() => {
              if (socket) {
                // Find socketId for this pc
                for (const [sId, conn] of peerConnectionsRef.current.entries()) {
                  if (conn === pc) {
                    socket.emit('huddle:signal', {
                      to: sId,
                      channelId,
                      signal: 'offer',
                      data: pc.localDescription,
                    });
                  }
                }
              }
            });
        });
      }
    } catch (err) {
      console.error('Camera toggle error:', err);
      alert('Could not access camera: ' + err.message);
    }
  }, [isVideoOn, socket, channelId]);

  // ── Toggle Screen Sharing ──
  const toggleScreenShare = useCallback(async () => {
    try {
      if (isScreenSharing) {
        // Stop screen sharing
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach(t => t.stop());
          screenStreamRef.current = null;
        }
        setScreenStream(null);
        setIsScreenSharing(false);

        // Restore camera or remove video track from peer connections
        const fallbackTrack = localStreamRef.current?.getVideoTracks()[0] || null;
        peerConnectionsRef.current.forEach(pc => {
          const senders = pc.getSenders();
          const videoSender = senders.find(s => s.track && s.track.kind === 'video');
          if (videoSender) {
            if (fallbackTrack) {
              videoSender.replaceTrack(fallbackTrack);
            } else {
              pc.removeTrack(videoSender);
            }
          }
        });
      } else {
        // Start screen sharing
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        screenStreamRef.current = stream;
        setScreenStream(stream);
        setIsScreenSharing(true);

        const screenTrack = stream.getVideoTracks()[0];
        screenTrack.onended = () => {
          toggleScreenShare(); // auto-revert when browser "Stop sharing" clicked
        };

        // Replace track in all peer connections
        peerConnectionsRef.current.forEach(pc => {
          const senders = pc.getSenders();
          const videoSender = senders.find(s => s.track && s.track.kind === 'video');
          if (videoSender) {
            videoSender.replaceTrack(screenTrack);
          } else {
            pc.addTrack(screenTrack, stream);
            pc.createOffer()
              .then(offer => pc.setLocalDescription(offer))
              .then(() => {
                if (socket) {
                  for (const [sId, conn] of peerConnectionsRef.current.entries()) {
                    if (conn === pc) {
                      socket.emit('huddle:signal', {
                        to: sId,
                        channelId,
                        signal: 'offer',
                        data: pc.localDescription,
                      });
                    }
                  }
                }
              });
          }
        });
      }
    } catch (err) {
      console.warn('Screen share canceled or error:', err);
    }
  }, [isScreenSharing, socket, channelId]);

  return {
    localStream,
    screenStream,
    isMuted,
    isVideoOn,
    isScreenSharing,
    isSpeaking,
    peers,
    mediaError,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
  };
}
