import './StartStream.css'; // Import a separate CSS file for styles

import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const StartStream = () => {
  const imgRef = useRef(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    // Test with a static image first
    imgRef.current.src = 'https://placekitten.com/150/150';

    const socket = io('http://localhost:5000/stream', {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      timeout: 20000,
    });

    socket.on('connect', () => {
      setStatus('Connected to backend stream');
      console.log('Connected to backend stream');
      socket.emit('start_stream');
    });

    socket.on('connect_error', (error) => {
      console.error('Connection Error:', error);
      setStatus('Connection failed. Retrying...');
    });

    socket.on('disconnect', () => {
      setStatus('Disconnected from backend stream');
    });

    return () => {
      socket.disconnect();
      console.log('Socket disconnected');
    };
  }, []);

  return (
    <div className="start-stream-container">
      <img ref={imgRef} className="start-stream-image" alt="Backend Stream" />
      <p className="stream-status">{status}</p>
    </div>
  );
};

export default StartStream;
