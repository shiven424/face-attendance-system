import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Select,
  Heading,
  useToast,
} from '@chakra-ui/react';
import { getData, postData } from '../services/api'; // Import the API functions

const FaceRegistration = () => {
  const [subjects, setSubjects] = useState([]); // All available subjects
  const [registeredSubjects, setRegisteredSubjects] = useState([]); // Subjects student is already enrolled in
  const [filteredSubjects, setFilteredSubjects] = useState([]); // Subjects excluding registered ones
  const [selectedSubject, setSelectedSubject] = useState('');
  const toast = useToast(); // Chakra UI toast for notifications

  useEffect(() => {
    fetchSubjects(); // Fetch subjects when the component mounts
  }, []);

  const fetchSubjects = async () => {
    try {
      // Fetch all available subjects
      const allSubjects = await getData('/subjects/students'); 
      // Fetch already registered subjects for the student
      const registered = await getData('/subjects/student'); 

      // Set both available and registered subjects
      setSubjects(allSubjects);
      setRegisteredSubjects(registered.subjectsEnrolled);

      // Filter out the subjects the student is already registered in
      const filtered = allSubjects.filter(subject => !registered.subjectsEnrolled.includes(subject.name));
      setFilteredSubjects(filtered);

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

  const handleRegisterSubject = async () => {
    const sessionData = {
      subject: selectedSubject,
    };

    try {
      // Add selected subject to student's database entry
      await postData('/enroll', sessionData);

      toast({
        title: 'Success',
        description: 'Subject Registered successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Optionally, refetch the subjects to update the dropdown after registration
      fetchSubjects();
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
          Register Subjects
        </Heading>

        {/* Subject Selection Dropdown */}
        <FormControl mb={4} isRequired>
          <FormLabel>Select Subject</FormLabel>
          <Select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            placeholder="Select subject"
          >
            {filteredSubjects.length > 0 ? (
              filteredSubjects.map((subject) => (
                <option key={subject.name} value={subject.name}>
                  {subject.name}
                </option>
              ))
            ) : (
              <option disabled>No available subjects to register</option>
            )}
          </Select>
        </FormControl>

        {/* Start Registration Button */}
        <Button
          colorScheme="blue"
          onClick={handleRegisterSubject}
          width="full"
          mb={4}
          isDisabled={!selectedSubject} // Disable if no subject is selected
        >
          Submit
        </Button>
      </Box>
    </Container>
  );
};

export default FaceRegistration;
