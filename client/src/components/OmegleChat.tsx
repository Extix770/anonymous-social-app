import React, { useState, useEffect, useRef, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';

const apiUrl = 'https://anonymous-api-tvtx.onrender.com';

const STUN_SERVERS = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }],
};

interface OmegleChatProps {
  onLeave: () => void;
}

const OmegleChat: React.FC<OmegleChatProps> = ({ onLeave }) => {
  const [status, setStatus] = useState('Looking for a partner...');
  const [isMuted, setIsMuted] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(STUN_SERVERS);

    pc.onicecandidate = event => {
      if (event.candidate) {
        socketRef.current?.emit('webrtc-signal', { candidate: event.candidate });
      }
    };

    pc.ontrack = event => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
    };

    localStreamRef.current?.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current!));

    return pc;
  }, []);

  const handleMatch = useCallback(({ isInitiator }: { isInitiator: boolean }) => {
    setStatus('Partner found! Connecting...');
    const pc = createPeerConnection();
    peerConnectionRef.current = pc;

    if (isInitiator) {
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .then(() => socketRef.current?.emit('webrtc-signal', { offer: pc.localDescription }));
    }
  }, [createPeerConnection]);

  const handleSignal = useCallback(async (data: any) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    if (data.offer) {
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketRef.current?.emit('webrtc-signal', { answer });
    } else if (data.answer) {
      await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
    } else if (data.candidate) {
      await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  }, []);

  const handlePartnerLeft = useCallback(() => {
    setStatus('Partner disconnected. Looking for a new partner...');
    if (peerConnectionRef.current) peerConnectionRef.current.close();
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    socketRef.current?.emit('find-partner'); // Automatically find a new partner
  }, []);

  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.RTCPeerConnection) {
      setStatus('Your browser does not support WebRTC.');
      return;
    }

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const socket = io(apiUrl);
        socketRef.current = socket;

        socket.on('connect', () => socket.emit('find-partner'));
        socket.on('matched', handleMatch);
        socket.on('webrtc-signal', handleSignal);
        socket.on('partner-left', handlePartnerLeft);

      } catch (error) {
        console.error('Error initializing chat:', error);
        if (error instanceof Error && error.name === 'NotAllowedError') {
          setStatus('Camera and microphone access denied. Please allow access to use this feature.');
        } else {
          setStatus('Error initializing chat. Please try again later.');
        }
      }
    };

    init();

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach(track => track.stop());
      if (peerConnectionRef.current) peerConnectionRef.current.close();
    };
  }, [onLeave, handleMatch, handleSignal, handlePartnerLeft]);

  const handleNext = () => {
    setStatus('Looking for a new partner...');
    if (peerConnectionRef.current) peerConnectionRef.current.close();
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    socketRef.current?.emit('next-partner');
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => track.enabled = !track.enabled);
      setIsMuted(prev => !prev);
    }
  };

  return (
    <div className="card mb-3">
      <div className="card-body">
        <h5 className="card-title">MysticHiddenFace</h5>
        <p>{status}</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '50%', transform: 'scaleX(-1)' }} />
          <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '50%' }} />
        </div>
        <div className="mt-2">
          <button className="btn btn-primary me-2" onClick={handleNext}>Next</button>
          <button className="btn btn-danger me-2" onClick={onLeave}>Leave</button>
          <button className="btn btn-warning" onClick={toggleMute}>{isMuted ? 'Unmute' : 'Mute'}</button>
        </div>
      </div>
    </div>
  );
};

export default OmegleChat;