import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Container,
  Heading,
  Select,
  FormControl,
  FormLabel,
  Input,
  useToast,
} from '@chakra-ui/react';
import { getData } from '../services/api'; // Import the API function to fetch subjects
import { postData } from '../services/api'; // Import the API function to create attendance session
import { useNavigate } from 'react-router-dom';

const TakeAttendance = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [attendanceMethod, setAttendanceMethod] = useState('');
  const [session_id, setSessionId] = useState('');
  const [photo, setPhoto] = useState(null); // State to store the uploaded photo
  const toast = useToast(); // Chakra UI toast for notifications
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubjects(); // Fetch subjects when the component mounts
    return () => {
    };
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await getData('/subjects/teachers'); // Adjust this endpoint to match your API
      setSubjects(response); // Set the subjects
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

  const handleMethodChange = (method) => {
    if (method === 'live') {
      setPhoto(null); // Clear photo when switching to live attendance
    } else {
      setPhoto(null); // Clear photo when switching to upload method
    }
    setAttendanceMethod(method); // Update the attendance method
  };

  const handlePhotoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result); // Set the uploaded photo for preview
      };
      reader.readAsDataURL(file); // Read the file as a data URL
    }
  };

  const createAttendanceSession = async () => {
    const sessionData = {
      subjectId: selectedSubject,
    };

    try {
      const response = await postData('/attendance/start', sessionData);
      setSessionId(response.sessionId); // Set the session ID
      toast({
        title: 'Success',
        description: 'Attendance session created successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/camera');
      console.log('Attendance session created:', response);
    } catch (error) {
      console.error('Error creating attendance session:', error.message);
      toast({
        title: 'Error',
        description: 'Failed to create attendance session.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleStartSession = () => {
    if (!selectedSubject) {
      toast({
        title: 'Error',
        description: 'Please select a subject before starting the session.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    createAttendanceSession(); // Create the attendance session in the database
  };

  return (
    <Container maxW="container.md" mt={10}>
      <Heading as="h1" size="lg" mb={4}>
        Take Attendance
      </Heading>

      <FormControl mb={4}>
        <FormLabel>Select Subject</FormLabel>
        <Select
          placeholder="Select a subject"
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
        >
          {subjects.map((subject) => (
            <option key={subject.name} value={subject.name}>
              {subject.name}
            </option>
          ))}
        </Select>
      </FormControl>

      <Heading as="h2" size="md" mb={2}>
        Select Attendance Method
      </Heading>
      <Button 
        colorScheme={attendanceMethod === 'live' ? 'blue' : 'gray'}
        onClick={() => handleMethodChange('live')}
        mr={2}
      >
        Live Attendance
      </Button>
      <Button 
        colorScheme={attendanceMethod === 'upload' ? 'blue' : 'gray'}
        onClick={() => handleMethodChange('upload')}
      >
        Upload Photo
      </Button>

      {/* Upload Photo input */}
      {attendanceMethod === 'upload' && (
        <Input 
          type="file" 
          accept="image/*" 
          onChange={handlePhotoUpload} 
          mt={4}
        />
      )}

      {/* Start and End Session buttons for live attendance */}
      {attendanceMethod === 'live' && (
        <>
          <Button 
            colorScheme="blue" 
            onClick={handleStartSession} 
            mt={4}
            width="full"
          >
            Start Session
          </Button>
        </>
      )}

      {/* Display the uploaded photo if available */}
      {photo && (
        <Box mt={4} textAlign="center">
          <Heading as="h2" size="md">Uploaded Photo</Heading>
          <img 
            src={photo} 
            alt="Uploaded" 
            style={{ width: '100%', height: 'auto', marginTop: '10px' }} 
          />
        </Box>
      )}

    </Container>
  );
};

export default TakeAttendance;
