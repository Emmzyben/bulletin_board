import { useState, useRef, useCallback, useEffect } from 'react';

const TYPING_EXPIRY_MS = 3000;

/**
 * Manages typing indicators via BroadcastChannel (same-origin tab sync)
 * plus a simple in-memory map keyed by user.
 * Falls back gracefully if BroadcastChannel is not available.
 */
export function useTyping({ channelId, userEmail, userName }) {
  const [typingUsers, setTypingUsers] = useState([]); // [{email, name}]
  const bcRef = useRef(null);
  const timersRef = useRef({});

  useEffect(() => {
    if (!channelId || typeof BroadcastChannel === 'undefined') return;
    const bc = new BroadcastChannel(`typing_${channelId}`);
    bcRef.current = bc;

    bc.onmessage = (e) => {
      const { email, name, type } = e.data || {};
      if (!email || email === userEmail) return;

      if (type === 'stop') {
        clearTimeout(timersRef.current[email]);
        delete timersRef.current[email];
        setTypingUsers(prev => prev.filter(u => u.email !== email));
        return;
      }

      // type === 'typing'
      setTypingUsers(prev => {
        if (prev.some(u => u.email === email)) return prev;
        return [...prev, { email, name }];
      });

      // Auto-expire
      clearTimeout(timersRef.current[email]);
      timersRef.current[email] = setTimeout(() => {
        setTypingUsers(prev => prev.filter(u => u.email !== email));
      }, TYPING_EXPIRY_MS);
    };

    return () => {
      bc.close();
      bcRef.current = null;
      Object.values(timersRef.current).forEach(clearTimeout);
    };
  }, [channelId, userEmail]);

  const stopTypingTimer = useRef(null);

  const onTyping = useCallback(() => {
    bcRef.current?.postMessage({ email: userEmail, name: userName, type: 'typing' });
    clearTimeout(stopTypingTimer.current);
    stopTypingTimer.current = setTimeout(() => {
      bcRef.current?.postMessage({ email: userEmail, name: userName, type: 'stop' });
    }, TYPING_EXPIRY_MS);
  }, [userEmail, userName]);

  const onStopTyping = useCallback(() => {
    clearTimeout(stopTypingTimer.current);
    bcRef.current?.postMessage({ email: userEmail, name: userName, type: 'stop' });
  }, [userEmail, userName]);

  return { typingUsers, onTyping, onStopTyping };
}