
import React, { useState, useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';

const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const VideoChat: React.FC = () => {
  const [isInChat, setIsInChat] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const peerConnectionsRef = useRef<{ [key: string]: RTCPeerConnection }>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const videoElementsRef = useRef<{ [key: string]: HTMLVideoElement }>({});
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const STUN_SERVERS = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }],
  };

  useEffect(() => {
    return () => {
      // Cleanup on component unmount
      if (socketRef.current) socketRef.current.disconnect();
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach(track => track.stop());
      Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
    };
  }, []);

  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [isInChat]);

  const handleJoinChat = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      localStreamRef.current = stream;
      setIsInChat(true);

      const socket = io(apiUrl);
      socketRef.current = socket;

      socket.on('connect', () => socket.emit('join-voice-chat'));
      socket.on('existing-users', ({ userIds }) => userIds.forEach(id => createPeerConnection(id, true, stream)));
      socket.on('user-joined', ({ newUserId }) => createPeerConnection(newUserId, false, stream));
      socket.on('webrtc-offer', handleOffer);
      socket.on('webrtc-answer', handleAnswer);
      socket.on('ice-candidate', handleIceCandidate);
      socket.on('user-left', handleUserLeft);

    } catch (error) {
      console.error('Error joining video chat:', error);
    }
  };

  const createPeerConnection = (remoteUserId: string, isInitiator: boolean, stream: MediaStream) => {
    const pc = new RTCPeerConnection(STUN_SERVERS);
    peerConnectionsRef.current[remoteUserId] = pc;

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.onicecandidate = event => {
      if (event.candidate) {
        socketRef.current?.emit('ice-candidate', { to: remoteUserId, candidate: event.candidate });
      }
    };

    pc.ontrack = event => {
      const videoContainer = document.getElementById('video-grid');
      const video = document.createElement('video');
      video.srcObject = event.streams[0];
      video.autoplay = true;
      video.playsInline = true;
      video.id = `video-${remoteUserId}`;
      videoElementsRef.current[remoteUserId] = video;
      videoContainer?.appendChild(video);
    };

    if (isInitiator) {
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .then(() => socketRef.current?.emit('webrtc-offer', { to: remoteUserId, offer: pc.localDescription }));
    }
    return pc;
  };

  const handleOffer = async ({ from, offer }: { from: string, offer: RTCSessionDescriptionInit }) => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const pc = createPeerConnection(from, false, stream);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socketRef.current?.emit('webrtc-answer', { to: from, answer });
  };

  const handleAnswer = async ({ from, answer }: { from: string, answer: RTCSessionDescriptionInit }) => {
    const pc = peerConnectionsRef.current[from];
    if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
  };

  const handleIceCandidate = ({ from, candidate }: { from: string, candidate: RTCIceCandidateInit }) => {
    const pc = peerConnectionsRef.current[from];
    if (pc) pc.addIceCandidate(new RTCIceCandidate(candidate));
  };

  const handleUserLeft = ({ userId }: { userId: string }) => {
    if (peerConnectionsRef.current[userId]) {
      peerConnectionsRef.current[userId].close();
      delete peerConnectionsRef.current[userId];
    }
    if (videoElementsRef.current[userId]) {
      videoElementsRef.current[userId].remove();
      delete videoElementsRef.current[userId];
    }
  };

  const handleLeaveChat = () => {
    if (socketRef.current) socketRef.current.disconnect();
    if (localStreamRef.current) localStreamRef.current.getTracks().forEach(track => track.stop());
    Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
    const videoContainer = document.getElementById('video-grid');
    if(videoContainer) videoContainer.innerHTML = '';
    peerConnectionsRef.current = {};
    videoElementsRef.current = {};
    localStreamRef.current = null;
    setIsInChat(false);
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => track.enabled = !track.enabled);
      setIsAudioMuted(prev => !prev);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => track.enabled = !track.enabled);
      setIsVideoMuted(prev => !prev);
    }
  };

  return (
    <div className="card mb-3">
      <div className="card-body">
        <h5 className="card-title">Global Video Chat</h5>
        {!isInChat ? (
          <button className="btn btn-success" onClick={handleJoinChat}>Join Video Chat</button>
        ) : (
          <div>
            <button className="btn btn-danger me-2" onClick={handleLeaveChat}>Leave Chat</button>
            <button className="btn btn-warning me-2" onClick={toggleAudio}>{isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}</button>
            <button className="btn btn-warning" onClick={toggleVideo}>{isVideoMuted ? 'Start Camera' : 'Stop Camera'}</button>
          </div>
        )}
        <div id="video-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', marginTop: '10px' }}>
          {isInChat && <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', transform: 'scaleX(-1)' }} />} 
        </div>
      </div>
    </div>
  );
};

export default VideoChat;
