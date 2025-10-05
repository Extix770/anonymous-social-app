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
      console.log('DEBUG: Cleaning up VoiceChat component');
      if (socketRef.current) socketRef.current.disconnect();
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach(track => track.stop());
      Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
    };
  }, []);

  const handleJoinChat = async () => {
    console.log('DEBUG: handleJoinChat called');
    try {
      console.log('DEBUG: Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      console.log('DEBUG: Microphone access granted.');
      localStreamRef.current = stream;
      setIsInChat(true);

      console.log(`DEBUG: Connecting to socket at ${apiUrl}`);
      const socket = io(apiUrl);
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log(`DEBUG: Socket connected with id: ${socket.id}`);
        console.log('DEBUG: Emitting join-voice-chat');
        socket.emit('join-voice-chat');
      });

      socket.on('existing-users', ({ userIds }: { userIds: string[] }) => {
        console.log('DEBUG: Received existing-users:', userIds);
        userIds.forEach(id => {
          console.log(`DEBUG: Creating peer connection for existing user ${id} (as initiator)`);
          createPeerConnection(id, true, stream);
        });
      });

      socket.on('user-joined', ({ newUserId }: { newUserId: string }) => {
        console.log(`DEBUG: Received user-joined: ${newUserId}`);
        console.log(`DEBUG: Creating peer connection for new user ${newUserId} (as non-initiator)`);
        createPeerConnection(newUserId, false, stream);
      });

      socket.on('webrtc-offer', async ({ from, offer }: { from: string, offer: RTCSessionDescriptionInit }) => {
        console.log(`DEBUG: Received webrtc-offer from ${from}`);
        const pc = createPeerConnection(from, false, stream);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        console.log(`DEBUG: Set remote description for offer from ${from}`);
        const answer = await pc.createAnswer();
        console.log(`DEBUG: Created answer for ${from}`);
        await pc.setLocalDescription(answer);
        console.log(`DEBUG: Set local description for answer to ${from}`);
        socket.emit('webrtc-answer', { to: from, answer });
        console.log(`DEBUG: Emitted webrtc-answer to ${from}`);
      });

      socket.on('webrtc-answer', async ({ from, answer }: { from: string, answer: RTCSessionDescriptionInit }) => {
        console.log(`DEBUG: Received webrtc-answer from ${from}`);
        const pc = peerConnectionsRef.current[from];
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          console.log(`DEBUG: Set remote description for answer from ${from}`);
        }
      });

      socket.on('ice-candidate', ({ from, candidate }: { from: string, candidate: RTCIceCandidateInit }) => {
        console.log(`DEBUG: Received ice-candidate from ${from}`);
        const pc = peerConnectionsRef.current[from];
        if (pc) {
          pc.addIceCandidate(new RTCIceCandidate(candidate));
          console.log(`DEBUG: Added ICE candidate from ${from}`);
        }
      });

      socket.on('user-left', ({ userId }: { userId: string }) => {
        console.log(`DEBUG: Received user-left: ${userId}`);
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
    console.log(`DEBUG: createPeerConnection for user ${remoteUserId}`);
    const pc = new RTCPeerConnection(STUN_SERVERS);
    peerConnectionsRef.current[remoteUserId] = pc;

    stream.getTracks().forEach(track => pc.addTrack(track, stream));
    console.log(`DEBUG: Added local stream tracks to peer connection for ${remoteUserId}`);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`DEBUG: onicecandidate: sending candidate to ${remoteUserId}`);
        socketRef.current?.emit('ice-candidate', { to: remoteUserId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      console.log(`DEBUG: ontrack: received remote stream from ${remoteUserId}`);
      const audio = document.createElement('audio');
      audio.srcObject = event.streams[0];
      audio.autoplay = true;
      audio.id = `audio-${remoteUserId}`;
      audioElementsRef.current[remoteUserId] = audio;
      document.body.appendChild(audio);
      console.log(`DEBUG: Audio element for ${remoteUserId} created and playing.`);
    };

    if (isInitiator) {
      console.log(`DEBUG: isInitiator is true, creating offer for ${remoteUserId}`);
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .then(() => {
          console.log(`DEBUG: Emitting webrtc-offer to ${remoteUserId}`);
          socketRef.current?.emit('webrtc-offer', { to: remoteUserId, offer: pc.localDescription });
        });
    }

    return pc;
  };

  const handleLeaveChat = () => {
    console.log('DEBUG: handleLeaveChat called');
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
      console.log(`DEBUG: Mute toggled to ${!isMuted}`);
    }
  };

  return (
    <div className="card mb-3">
      <div className="card-body">
        <h5 className="card-title">Global Voice Chat (Beta)</h5>
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