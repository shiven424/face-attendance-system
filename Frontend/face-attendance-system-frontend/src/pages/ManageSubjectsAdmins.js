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
import { DeleteIcon } from '@chakra-ui/icons';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons'; // Import arrow icons
import { getData, updateData, postData } from '../services/api'; // Import the API functions

const ManageSubjectsAdmins = () => {
  const [subjects, setSubjects] = useState([]);
  const [expandedSubject, setExpandedSubject] = useState(null); // State to track expanded subject
  const toast = useToast(); // Chakra UI toast for notifications

  useEffect(() => {
    fetchSubjects(); // Fetch subjects when the component mounts
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await getData('/subjects/students'); // Adjust to your endpoint for fetching subjects
      console.log('Fetched Subjects:', response); // Log the response for debugging
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

  const handleRemoveStudentFromSubject = async (subject, studentEmail) => {
    try {
      // Send request to remove a student from the subject
      console.log(studentEmail, subject);
      await updateData(`/students/${studentEmail}/remove-subject`, { subject }); // Adjust to your API endpoint
      fetchSubjects(); // Refresh the list of subjects
      toast({
        title: 'Success',
        description: `Removed ${studentEmail} from ${subject}.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error removing student from subject:', error.message);
      toast({
        title: 'Error',
        description: 'Failed to remove student from subject.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleRemoveSubject = async (subject) => {
    try {
      // Send request to remove the subject completely
      await postData(`/subjects/remove`, { name: subject }); // Adjust to your API endpoint
      fetchSubjects(); // Refresh the list of subjects
      toast({
        title: 'Success',
        description: `Removed ${subject} successfully.`,
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

  const toggleExpandSubject = (subjectName) => {
    setExpandedSubject(expandedSubject === subjectName ? null : subjectName);
  };

  return (
    <Container maxW="container.xl" mt={10}>
      <Heading as="h1" size="lg" mb={4}>
        Manage Subjects
      </Heading>
      <List spacing={3}>
        {subjects.length > 0 ? (
          subjects.map((subject) => (
            <ListItem
              key={subject.name}
              p={4}
              borderWidth="1px"
              borderRadius="md"
              boxShadow="md"
              bg="white"
              position="relative" // Add position for the arrow icon
            >
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box flex="1" onClick={() => toggleExpandSubject(subject.name)} cursor="pointer">
                    <Text fontWeight="bold" fontSize="lg">
                      Subject: {subject.name}
                    </Text>
                    <Text color="gray.500">
                      Teacher: {subject.teacherMail ? subject.teacherMail : 'N/A'}
                    </Text>
                  </Box>
                  <IconButton
                    aria-label="Delete Subject"
                    icon={<DeleteIcon />}
                    colorScheme="red"
                    onClick={() => handleRemoveSubject(subject.name)}
                  />
                </Stack>

                {expandedSubject === subject.name && (
                  <Box mt={2} bg="gray.100" p={3} borderRadius="md" color="black">
                    <Text fontWeight="bold">Students:</Text>
                    {Array.isArray(subject.students) && subject.students.length > 0 ? (
                      <Stack spacing={2}>
                        {subject.students.map((studentEmail) => (
                          <Stack key={studentEmail} direction="row" justifyContent="space-between" alignItems="center">
                            <Text>{studentEmail}</Text>
                            <Button
                              variant="outline"
                              colorScheme="red"
                              size="sm"
                              onClick={() => handleRemoveStudentFromSubject(subject.name, studentEmail)}
                            >
                              Remove
                            </Button>
                          </Stack>
                        ))}
                      </Stack>
                    ) : (
                      <Text color="gray.500">No students assigned.</Text>
                    )}
                  </Box>
                )}
                
                {/* Arrow Icon */}
                <Box 
                  position="absolute" 
                  bottom={2} 
                  left="50%" 
                  transform="translateX(-50%)"
                  onClick={() => toggleExpandSubject(subject.name)} 
                  cursor="pointer"
                  zIndex="1"
                >
                  {expandedSubject === subject.name ? (
                    <ChevronUpIcon boxSize={6} /> // Up arrow when expanded
                  ) : (
                    <ChevronDownIcon boxSize={6} /> // Down arrow when collapsed
                  )}
                </Box>
              </Stack>
            </ListItem>
          ))
        ) : (
          <Text>No subjects found.</Text>
        )}
      </List>
    </Container>
  );
};

export default ManageSubjectsAdmins;
