import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Select,
  Heading,
  Text,
  useToast,
} from '@chakra-ui/react';
import { getData, postData, updateData } from '../services/api'; // Import the API function to fetch subjects
import './FaceRegistration.css'; // Import custom CSS for animations

const FaceRegistration = () => {
  const [subjects, setSubjects] = useState([]);
  const [allsubjects, setAllSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [registeredSubjects, setRegisteredSubjects] = useState([]);
  const [isRegistrationActive, setIsRegistrationActive] = useState(false);
  const [studentEmail, setStudentEmail] = useState('student@example.com'); // Replace with actual logged-in student's email
  const videoRef = useRef(null); // Ref to hold the video element
  const streamRef = useRef(null); // Ref to hold the media stream
  const toast = useToast(); // Chakra UI toast for notifications
  const [captureStep, setCaptureStep] = useState(0); // Step counter for 5 angles
  const [captureInstructions, setCaptureInstructions] = useState([
    'Look Straight',
    'Look Left',
    'Look Right',
    'Look Up',
    'Look Down',
  ]);

  useEffect(() => {
    fetchSubjects(); // Fetch subjects when the component mounts
  }, []);

  const fetchSubjects = async () => {
    try {
      const response1 = await getData('/subjects/students'); // Adjust this endpoint to match your API
      setAllSubjects(response1);
      const response2 = await getData('/subjects/student');
      setRegisteredSubjects(response2.subjectsEnrolled);

      const filtered = response1.filter(subject => !response2.subjectsEnrolled.includes(subject.name));
      setSubjects(filtered);

    } catch (error) {
      console.error('Error fetching subjects:', error.message);
      toast({
        title: 'Error',
        description: 'Failed to fetch subjects.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSubjectChange = (event) => {
    const value = Array.from(event.target.selectedOptions, (option) => option.value);
    setSelectedSubject(value); // Update selected subjects
  };

  const startFaceRegistration = () => {
    if (selectedSubject.length === 0) {
      toast({
        title: 'Warning',
        description: 'Please select at least one subject before starting registration.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setIsRegistrationActive(true);
    setCaptureStep(0);
    startCamera();
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      streamRef.current = stream; // Save the stream to stop it later
    } catch (error) {
      console.error('Error accessing camera:', error.message);
      toast({
        title: 'Error',
        description: 'Could not access the camera. Please check your permissions.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null; // Clear the reference
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null; // Clear the video source
    }
  };

  const captureImage = async () => {
    if (!videoRef.current) return;

    // Capture frame from video element
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    // Convert to Blob for backend
    const imageBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg'));

    const formData = new FormData();
    formData.append('image', imageBlob);
    formData.append('subject', selectedSubject);
    formData.append('step', captureStep);

    try {
      const response = await postData('/face-registration/capture', formData, true); // Replace with your backend endpoint
      toast({
        title: 'Image Captured',
        description: `Captured image for "${captureInstructions[captureStep]}".`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      console.log(response);
      // Move to the next step
      if (captureStep < 5) {
        setCaptureStep(captureStep + 1);
      } else {
        // All steps completed
        toast({
          title: 'All Images Captured',
          description: 'You can now end the registration.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error uploading image:', error.message);
      toast({
        title: 'Error',
        description: 'Failed to capture image. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleCancelRegistration = () => {
    stopCamera();
    setIsRegistrationActive(false);
    setCaptureStep(0);
    toast({
      title: 'Registration Cancelled',
      description: 'Face registration has been cancelled.',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };  

  const handleEndRegistration = async () => {
    stopCamera();
    setIsRegistrationActive(false);

    const sessionData = {
      subject: selectedSubject,
    };

    try {
      // Add selected subjects to student's database entry
      await postData('/enroll', sessionData);

      toast({
        title: 'Success',
        description: 'Face registration completed successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error updating registration data:', error.message);
      toast({
        title: 'Error',
        description: 'Failed to update registration data in the database.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="container.sm" centerContent>
      <Box p={6} boxShadow="md" borderWidth="1px" borderRadius="md" mt={10} bg="white">
        <Heading as="h1" size="lg" mb={4}>
          Face Registration for Subjects
        </Heading>

        {/* Subject Selection Dropdown */}
        <FormControl mb={4} isRequired>
          <FormLabel>Select Subject</FormLabel>
          <Select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            placeholder="Select subject"
          >
            {subjects.map((subject) => (
              <option key={subject.name} value={subject.name}>
                {subject.name}
              </option>
            ))}
          </Select>
        </FormControl>

        {/* Start Registration Button */}
        <Button
          colorScheme="blue"
          onClick={startFaceRegistration}
          isDisabled={isRegistrationActive}
          width="full"
          mb={4}
        >
          Start Registration
        </Button>

        {/* Video Feed for Face Registration */}
        {isRegistrationActive && (
          <Box mt={3} textAlign="center" className="video-container" bg="gray.900" p={4} borderRadius="md">
            <Text fontSize="lg" mb={2} color="white">{captureInstructions[captureStep]}</Text>
            <div className="video-wrapper">
              <video ref={videoRef} className="video-feed"></video>
              <div className="scan-line"></div>
            </div>
            <Button
              colorScheme="teal"
              onClick={captureImage}
              width="full"
              mt={4}
              isDisabled={captureStep > 5}
            >
              Capture Image
            </Button>
            <Button
              colorScheme="red"
              onClick={handleCancelRegistration}
              width="full"
              mt={4}
            >
              Cancel Registration
            </Button>
            {captureStep === 5 && (
              <Button
                colorScheme="green"
                onClick={handleEndRegistration}
                width="full"
                mt={4}
              >
                End Registration
              </Button>
            )}
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default FaceRegistration;
