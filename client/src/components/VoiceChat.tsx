
import React, { useState, useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';

const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const VoiceChat: React.FC = () => {
  const [isInChat, setIsInChat] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionsRef = useRef<{ [key: string]: RTCPeerConnection }>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioElementsRef = useRef<{ [key: string]: HTMLAudioElement }>({});

  const STUN_SERVERS = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  useEffect(() => {
    return () => {
      // Cleanup on component unmount
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
    };
  }, []);

  const handleJoinChat = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      setIsInChat(true);

      const socket = io(apiUrl);
      socketRef.current = socket;

      socket.emit('join-voice-chat');

      socket.on('existing-users', ({ userIds }: { userIds: string[] }) => {
        userIds.forEach(id => createPeerConnection(id, true, stream));
      });

      socket.on('user-joined', ({ newUserId }: { newUserId: string }) => {
        createPeerConnection(newUserId, false, stream);
      });

      socket.on('webrtc-offer', async ({ from, offer }: { from: string, offer: RTCSessionDescriptionInit }) => {
        const pc = createPeerConnection(from, false, stream);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc-answer', { to: from, answer });
      });

      socket.on('webrtc-answer', async ({ from, answer }: { from: string, answer: RTCSessionDescriptionInit }) => {
        const pc = peerConnectionsRef.current[from];
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
      });

      socket.on('ice-candidate', ({ from, candidate }: { from: string, candidate: RTCIceCandidateInit }) => {
        const pc = peerConnectionsRef.current[from];
        if (pc) {
          pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      });

      socket.on('user-left', ({ userId }: { userId: string }) => {
        if (peerConnectionsRef.current[userId]) {
          peerConnectionsRef.current[userId].close();
          delete peerConnectionsRef.current[userId];
        }
        if (audioElementsRef.current[userId]) {
          audioElementsRef.current[userId].remove();
          delete audioElementsRef.current[userId];
        }
      });

    } catch (error) {
      console.error('Error joining voice chat:', error);
    }
  };

  const createPeerConnection = (remoteUserId: string, isInitiator: boolean, stream: MediaStream) => {
    const pc = new RTCPeerConnection(STUN_SERVERS);
    peerConnectionsRef.current[remoteUserId] = pc;

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit('ice-candidate', { to: remoteUserId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      const audio = document.createElement('audio');
      audio.srcObject = event.streams[0];
      audio.autoplay = true;
      audioElementsRef.current[remoteUserId] = audio;
      document.body.appendChild(audio);
    };

    if (isInitiator) {
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .then(() => {
          socketRef.current?.emit('webrtc-offer', { to: remoteUserId, offer: pc.localDescription });
        });
    }

    return pc;
  };

  const handleLeaveChat = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
    peerConnectionsRef.current = {};
    Object.values(audioElementsRef.current).forEach(audio => audio.remove());
    audioElementsRef.current = {};
    setIsInChat(false);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="card mb-3">
      <div className="card-body">
        <h5 className="card-title">Global Voice Chat</h5>
        {!isInChat ? (
          <button className="btn btn-success" onClick={handleJoinChat}>Join Voice Chat</button>
        ) : (
          <div>
            <button className="btn btn-danger me-2" onClick={handleLeaveChat}>Leave Chat</button>
            <button className="btn btn-warning" onClick={toggleMute}>
              {isMuted ? 'Unmute' : 'Mute'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceChat;
