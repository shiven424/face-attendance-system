import './CameraStream.css';
import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL, postData } from '../services/api';
import { Button, useToast} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const CameraStream = () => {
  const imgRef = useRef(null);
  const [status, setStatus] = useState('');
  const [processing, setProcessing] = useState(false);
  const [fps, setFps] = useState(1);
  const frameBuffer = useRef([]);
  const displayIntervalRef = useRef(null);
  const captureIntervalRef = useRef(null);
  const [attendance, setAttendance] = useState({}); // State for attendance
  const [lastUpdateTime, setLastUpdateTime] = useState({}); // Track last update times
  const [lastValidStatus, setLastValidStatus] = useState({}); // Track last valid status and its time
  const resetTimeouts = useRef({}); // To hold timeouts for resetting status to "Unknown"
  const markedBeepSet = useRef(new Set()); // Set to track if beep has already been played for a student
  const navigate = useNavigate(); // Initialize navigate for redirection
  const toast = useToast();
  const attendanceBeep = useRef(new Audio('/sounds/attendance_marked.wav'));

  useEffect(() => {
    attendanceBeep.current.onerror = () => {
      console.error('Failed to load beep audio');
    };
    attendanceBeep.current.oncanplaythrough = () => {
      console.log('Beep audio is ready to play');
    };

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      timeout: 20000,
    });

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = stream.getVideoTracks()[0];
        const imageCapture = new ImageCapture(videoTrack);

        socket.on('connect', () => {
          setStatus('Connected to server');
          captureIntervalRef.current = setInterval(() => {
            sendFrame(imageCapture, socket);
          }, 1000 / fps);

          displayIntervalRef.current = setInterval(() => {
            displayFrame();
          }, 1000 / fps);
        });

        socket.on('processed_frame', (data) => {
          const blob = new Blob([data.frame], { type: 'image/jpeg' });
          const url = URL.createObjectURL(blob);
          frameBuffer.current.push(url);

          const newAttendance = { ...data.attendance_status };
          Object.entries(newAttendance).forEach(([name, status]) => {
            if (status !== 'Unknown') {
              if (status === "Marked" && !markedBeepSet.current.has(name)) {
                attendanceBeep.current.play();
                markedBeepSet.current.add(name); // Add to set to prevent further beeps
              }

              setLastUpdateTime((prev) => ({
                ...prev,
                [name]: Date.now(),
              }));
              setLastValidStatus((prev) => ({
                ...prev,
                [name]: status,
              }));

              // Clear any existing timeout for resetting to "Unknown"
              if (resetTimeouts.current[name]) {
                clearTimeout(resetTimeouts.current[name]);
              }

              // Set a new timeout to reset the status to "Unknown" after 5 seconds
              resetTimeouts.current[name] = setTimeout(() => {
                setLastValidStatus((prev) => ({
                  ...prev,
                  [name]: 'Unknown',
                }));
                setLastUpdateTime((prev) => ({
                  ...prev,
                  [name]: null,
                }));
              }, 5000);
            }
          });

          setAttendance(newAttendance);
        });

        socket.on('connect_error', (error) => {
          console.error('Connection Error:', error);
          setStatus('Connection failed. Retrying...');
        });

        socket.on('disconnect', () => {
          setStatus('Disconnected from server');
        });
      } catch (err) {
        setStatus('Unable to access camera');
        console.error(err);
      }
    };

    const sendFrame = async (imageCapture, socket) => {
      if (!socket.connected || processing) return;

      setProcessing(true);

      try {
        const bitmap = await imageCapture.grabFrame();
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        canvas.getContext('2d').drawImage(bitmap, 0, 0);

        canvas.toBlob((blob) => {
          if (socket.connected) {
            const reader = new FileReader();
            reader.onload = () => {
              console.log('Sending frame...');
              socket.emit('binary_frame', reader.result);
            };
            reader.readAsArrayBuffer(blob);
          }
        }, 'image/jpeg');
      } catch (error) {
        console.error('Error capturing or sending frame:', error);
      } finally {
        setProcessing(false);
      }
    };

    const displayFrame = () => {
      if (frameBuffer.current.length > 0) {
        const nextFrameUrl = frameBuffer.current.shift();
        imgRef.current.src = nextFrameUrl;
      }
    };

    startCamera();

    return () => {
      clearInterval(captureIntervalRef.current);
      clearInterval(displayIntervalRef.current);
      const stream = imgRef.current?.srcObject;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      socket.disconnect();
      console.log('Socket disconnected and camera stopped');

      // Clear all timeouts on cleanup
      Object.values(resetTimeouts.current).forEach((timeout) => clearTimeout(timeout));
    };
  }, [fps]);

  // Function to handle end session and redirect to TakeAttendance page
  const handleEndSession = async () => {
    try {
      // Update the session as inactive in the database
      await postData('/attendance/end'); // Send sessionId to mark it inactive
      attendanceBeep.current.play();
      toast({
        title: 'Session Ended',
        description: 'The attendance session has been successfully ended.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      navigate('/take-attendance'); // Redirect to TakeAttendance page
    } catch (error) {
      console.error('Error ending session:', error);
      toast({
        title: 'Error',
        description: 'Failed to end the attendance session.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <div className="camera-stream-container">
      <div className="camera-feed">
        <img ref={imgRef} className="camera-stream-image" alt="Camera Stream" />
        <p className="camera-status">{status}</p>
      </div>
      
      <div className="controls-container">
        {/* Attendance Status Display */}
        <div className="attendance-status-container">
          <h3>Attendance Status</h3>
          {Object.entries(attendance).map(([name, status]) => (
            <p
              key={name}
              className={
                lastValidStatus[name] !== 'Unknown'
                  ? 'attendance-status valid'
                  : 'attendance-status'
              }
            >
              {name}: {lastValidStatus[name] || 'Unknown'}
            </p>
          ))}
        </div>

        {/* FPS Slider */}
        <div className="fps-slider-container">
          <label htmlFor="fpsSlider">FPS: {fps}</label>
          <input
            type="range"
            id="fpsSlider"
            min="1"
            max="60"
            value={fps}
            onChange={(e) => setFps(parseInt(e.target.value))}
          />
        </div>

        {/* End Session Button */}
        <Button 
          colorScheme="red" 
          onClick={handleEndSession} // Call the handleEndSession function
          mt={4}
          width="full"
        >
          End Session
        </Button>
      </div>
    </div>
  );
};

export default CameraStream;
