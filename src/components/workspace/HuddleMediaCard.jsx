import React, { useEffect, useRef } from 'react';
import { Mic, MicOff, Headphones, Monitor } from 'lucide-react';

/**
 * HuddleMediaCard
 * Renders an active participant card with live audio/video playback,
 * speaking wave animation, and video/screen share display.
 */
export default function HuddleMediaCard({
  peer,
  isSelf = false,
  isSpeaking = false,
  isMuted = false,
  isVideoOn = false,
  isScreenSharing = false,
  stream = null,
}) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, isVideoOn, isScreenSharing]);

  useEffect(() => {
    // Only remote streams need <audio> playback (playing own audio creates feedback loop)
    if (!isSelf && audioRef.current && stream) {
      audioRef.current.srcObject = stream;
      audioRef.current.play().catch(err => {
        console.warn('Audio autoplay blocked; user gesture required:', err);
      });
    }
  }, [isSelf, stream]);

  const hasVideoTrack = stream && stream.getVideoTracks().some(t => t.enabled && t.readyState === 'live');
  const showVideo = (isSelf ? (isVideoOn || isScreenSharing) : hasVideoTrack);

  const displayName = isSelf ? 'You (Host)' : (peer?.userName || peer?.userEmail?.split('@')[0] || 'Teammate');
  const initials = isSelf
    ? (displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'YO')
    : (peer?.userName || peer?.userEmail || 'U')[0].toUpperCase();

  const avatarGradient = isSelf
    ? 'linear-gradient(135deg,#7C4DFF,#F472B6)'
    : `hsl(${((peer?.userEmail || 'u').charCodeAt(0) * 37) % 360},55%,40%)`;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
      position: 'relative',
    }}>
      {/* Hidden audio element for remote stream audio */}
      {!isSelf && <audio ref={audioRef} autoPlay playsInline />}

      <div style={{
        width: showVideo ? 260 : 100,
        height: showVideo ? 180 : 100,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0B1628',
        border: isSpeaking ? '3px solid #00C853' : '3px solid rgba(255,255,255,.08)',
        boxShadow: isSpeaking ? '0 0 26px rgba(0,200,83,.55)' : '0 4px 20px rgba(0,0,0,.3)',
        transition: 'all .25s ease',
      }}>
        {showVideo ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isSelf} // Always mute local video playback to avoid feedback
            style={{
              width: '100%',
              height: '100%',
              objectFit: isScreenSharing ? 'contain' : 'cover',
              transform: (isSelf && isVideoOn && !isScreenSharing) ? 'scaleX(-1)' : 'none',
              background: '#060D1A',
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 34,
            fontWeight: 800,
            color: '#fff',
            background: avatarGradient,
          }}>
            {initials}
          </div>
        )}

        {/* Speaking / Mute badge indicator */}
        <div style={{
          position: 'absolute',
          bottom: 8,
          right: 8,
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: isMuted ? '#EF5350' : isSpeaking ? '#00C853' : 'rgba(15,30,53,.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid #0F1E35',
          boxShadow: isSpeaking ? '0 0 8px #00C853' : 'none',
        }}>
          {isMuted ? (
            <MicOff size={12} color="#fff" />
          ) : isSpeaking ? (
            <Mic size={12} color="#fff" />
          ) : (
            <Headphones size={12} color="#7FA8D4" />
          )}
        </div>

        {/* Screen share badge if active */}
        {isScreenSharing && (
          <div style={{
            position: 'absolute',
            top: 8,
            left: 8,
            padding: '3px 8px',
            borderRadius: 6,
            background: 'rgba(27,110,243,.9)',
            fontSize: 10,
            fontWeight: 700,
            color: '#fff',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <Monitor size={11} color="#fff" />
            <span>Presenting</span>
          </div>
        )}
      </div>

      {/* Participant label with speaking wave */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {isSpeaking && (
          <span style={{
            display: 'inline-block',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#00C853',
            boxShadow: '0 0 6px #00C853',
            animation: 'pulse 1s infinite',
          }} />
        )}
        <span style={{ fontSize: 13, fontWeight: 600, color: isSpeaking ? '#EEF4FF' : '#7FA8D4' }}>
          {displayName}
        </span>
      </div>
    </div>
  );
}
