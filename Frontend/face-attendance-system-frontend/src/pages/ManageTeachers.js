import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  Stack,
  useToast,
  IconButton,
  List,
  ListItem,
} from '@chakra-ui/react';
import { DeleteIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons'; // Import arrow icons
import { getData, postData } from '../services/api'; // Import the API functions

const ManageTeachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [expandedTeacher, setExpandedTeacher] = useState(null); // Track which teacher's subjects are expanded
  const toast = useToast(); // Chakra UI toast for notifications

  useEffect(() => {
    fetchTeachers(); // Fetch teachers when the component mounts
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await getData('/teachers'); // Adjust to your endpoint for fetching teachers
      setTeachers(response); // Set the teachers
    } catch (error) {
      console.error('Error fetching teachers:', error.message);
      toast({
        title: 'Error',
        description: 'Failed to fetch teachers.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleRemoveSubject = async (teacherEmail, subject) => {
    try {
      // Send request to remove subject from the teacher's list
      await postData(`/subjects/remove`, { name: subject }); // Adjust to your API endpoint
      fetchTeachers(); // Refresh the list of teachers
      toast({
        title: 'Subject Removed',
        description: `Removed ${subject} from ${teacherEmail}'s subjects.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error removing subject:', error.message);
      toast({
        title: 'Error',
        description: 'Failed to remove subject.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleRemoveTeacher = async (teacherEmail) => {
    try {
      // Send request to remove the teacher
      await postData(`/teachers/remove`, { email: teacherEmail }); // Adjust to your API endpoint
      fetchTeachers(); // Refresh the list of teachers
      toast({
        title: 'Teacher Removed',
        description: `${teacherEmail} has been removed.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error removing teacher:', error.message);
      toast({
        title: 'Error',
        description: 'Failed to remove teacher.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const toggleExpandTeacher = (email) => {
    setExpandedTeacher(expandedTeacher === email ? null : email); // Toggle expanded teacher
  };

  return (
    <Container maxW="container.xl" mt={10}>
      <Heading as="h1" size="lg" mb={4}>
        Registered Teachers
      </Heading>
      <List spacing={3}>
        {teachers.length > 0 ? (
          teachers.map((teacher) => (
            <ListItem key={teacher.email} position="relative" p={4} borderWidth="1px" borderRadius="md" boxShadow="md" bg="white">
              <Stack spacing={2} direction="row" alignItems="center">
                <Box flex="1" onClick={() => toggleExpandTeacher(teacher.email)} cursor="pointer">
                  <Text fontWeight="bold" fontSize="lg">{teacher.name}</Text>
                  <Text color="gray.500">
                    Email: {teacher.email}
                  </Text>
                </Box>
                <IconButton
                  aria-label="Delete Teacher"
                  icon={<DeleteIcon />}
                  colorScheme="red"
                  onClick={() => handleRemoveTeacher(teacher.email)}
                />
              </Stack>

              {/* Display subjects if this teacher is expanded */}
              {expandedTeacher === teacher.email && (
                <Box mt={2} p={4} borderWidth="1px" borderRadius="md" bg="gray.100">
                  <Text fontWeight="bold">Subjects:</Text>
                  {Array.isArray(teacher.subjects) && teacher.subjects.length > 0 ? (
                    <Stack spacing={2} mt={2}>
                      {teacher.subjects.map((subject) => (
                        <Stack direction="row" justifyContent="space-between" key={subject}>
                          <Text>{subject}</Text>
                          <Button
                            variant="outline"
                            colorScheme="red"
                            size="sm"
                            onClick={() => handleRemoveSubject(teacher.email, subject)}
                          >
                            Remove
                          </Button>
                        </Stack>
                      ))}
                    </Stack>
                  ) : (
                    <Text color="gray.500">No subjects assigned.</Text>
                  )}
                </Box>
              )}

              {/* Arrow Icon for Expanding/Collapsing */}
              <Box
                position="absolute"
                bottom={2}
                left="50%"
                transform="translateX(-50%)"
                onClick={() => toggleExpandTeacher(teacher.email)}
                cursor="pointer"
                zIndex="1"
              >
                {expandedTeacher === teacher.email ? (
                  <ChevronUpIcon boxSize={6} /> // Up arrow when expanded
                ) : (
                  <ChevronDownIcon boxSize={6} /> // Down arrow when collapsed
                )}
              </Box>
            </ListItem>
          ))
        ) : (
          <Text>No teachers found.</Text>
        )}
      </List>
    </Container>
  );
};

export default ManageTeachers;
