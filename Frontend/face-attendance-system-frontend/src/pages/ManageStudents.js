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
} from '@chakra-ui/react';
import { DeleteIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons'; // Import arrow icons
import { getData, updateData, postData } from '../services/api'; // Import the API functions

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [expandedStudent, setExpandedStudent] = useState(null); // Track which student's subjects are expanded
  const toast = useToast(); // Chakra UI toast for notifications

  useEffect(() => {
    fetchStudents(); // Fetch students when the component mounts
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await getData('/students'); // Adjust to your endpoint for fetching students
      console.log('Fetched Students:', response); // Log the response for debugging
      setStudents(response); // Set the students
    } catch (error) {
      console.error('Error fetching students:', error.message);
      toast({
        title: 'Error',
        description: 'Failed to fetch students.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleRemoveSubject = async (studentEmail, subject) => {
    try {
      // Send request to remove subject from the student's list
      console.log(studentEmail, subject);
      await updateData(`/students/${studentEmail}/remove-subject`, { subject }); // Adjust to your API endpoint
      fetchStudents(); // Refresh the list of students
      toast({
        title: 'Subject Removed',
        description: `Removed ${subject} from ${studentEmail}'s subjects.`,
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

  const handleRemoveStudent = async (studentEmail) => {
    try {
      // Send request to remove the student
      await postData(`/students/remove`, { email: studentEmail }); // Adjust to your API endpoint
      fetchStudents(); // Refresh the list of students
      toast({
        title: 'Student Removed',
        description: `${studentEmail} has been removed.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error removing student:', error.message);
      toast({
        title: 'Error',
        description: 'Failed to remove student.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const toggleExpandStudent = (email) => {
    setExpandedStudent(expandedStudent === email ? null : email); // Toggle expanded student
  };

  return (
    <Container maxW="container.xl" mt={10}>
      <Heading as="h1" size="lg" mb={4}>
        Registered Students
      </Heading>
      <Stack spacing={3}>
        {students.length > 0 ? (
          students.map((student) => (
            <Box
              key={student.email}
              p={4}
              borderWidth="1px"
              borderRadius="md"
              boxShadow="md"
              bg="white"
              display="flex"
              flexDirection="column"
              justifyContent="space-between"
              height="100%"
              position="relative" // For positioning the arrow
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box onClick={() => toggleExpandStudent(student.email)} cursor="pointer" flex="1">
                  <Text fontWeight="bold" fontSize="lg">
                    {student.name}
                  </Text>
                  <Text color="gray.500">Email: {student.email}</Text>
                </Box>
                <IconButton
                  aria-label="Delete Student"
                  icon={<DeleteIcon />}
                  colorScheme="red"
                  onClick={() => handleRemoveStudent(student.email)}
                />
              </Stack>

              {/* Display subjects if this student is expanded */}
              {expandedStudent === student.email && (
                <Box mt={2} p={4} borderWidth="1px" borderRadius="md" bg="gray.100">
                  <Text fontWeight="bold">Subjects:</Text>
                  {Array.isArray(student.subjects) && student.subjects.length > 0 ? (
                    <Stack spacing={2} mt={2}>
                      {student.subjects.map((subject) => (
                        <Stack direction="row" justifyContent="space-between" key={subject} alignItems="center">
                          <Text>{subject}</Text>
                          <Button
                            variant="outline"
                            colorScheme="red"
                            size="sm"
                            onClick={() => handleRemoveSubject(student.email, subject)}
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
                onClick={() => toggleExpandStudent(student.email)}
                cursor="pointer"
                zIndex="1"
              >
                {expandedStudent === student.email ? (
                  <ChevronUpIcon boxSize={6} /> // Up arrow when expanded
                ) : (
                  <ChevronDownIcon boxSize={6} /> // Down arrow when collapsed
                )}
              </Box>
            </Box>
          ))
        ) : (
          <Text>No students found.</Text>
        )}
      </Stack>
    </Container>
  );
};

export default ManageStudents;
