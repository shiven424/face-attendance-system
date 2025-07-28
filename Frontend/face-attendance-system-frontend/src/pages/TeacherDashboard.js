import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  List,
  ListItem,
  useToast,
} from '@chakra-ui/react';
import { getData } from '../services/api'; // Import the API function to fetch subjects

const TeacherDashboard = () => {
  const [subjects, setSubjects] = useState([]);
  const toast = useToast(); // Chakra UI toast for notifications

  useEffect(() => {
    fetchSubjects(); // Fetch subjects when the component mounts
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await getData('/subjects/teachers'); // Adjust to your endpoint for fetching subjects
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

  return (
    <Container maxW="container.md" mt={10}>
      <Heading as="h1" size="lg" mb={4}>
        Your Subjects
      </Heading>
      <List spacing={3}>
        {subjects.length > 0 ? (
          subjects.map((subject) => (
            <ListItem key={subject.id} p={4} borderWidth="1px" borderRadius="md" boxShadow="md" bg="white">
              <Text fontWeight="bold" fontSize="lg">
                {subject.name}
              </Text>
            </ListItem>
          ))
        ) : (
          <Text>No subjects found.</Text>
        )}
      </List>
    </Container>
  );
};

export default TeacherDashboard;
