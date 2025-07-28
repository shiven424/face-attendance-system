import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Heading,
  Input,
  List,
  ListItem,
  ListIcon,
  Text,
  useToast,
  IconButton,
  Icon
} from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';
import { postData, getData } from '../services/api';

// Custom Book Icon Component
const BookIcon = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path d="M5 3C4.44772 3 4 3.44772 4 4V20C4 20.5523 4.44772 21 5 21H19C19.5523 21 20 20.5523 20 20V4C20 3.44772 19.5523 3 19 3H5ZM5 1H19C20.1046 1 21 1.89543 21 3V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V4C3 2.89543 3.89543 2 5 2V1ZM6 4H18V20H6V4Z" />
  </Icon>
);

const ManageSubjectsTeachers = () => {
  const [subject, setSubject] = useState('');
  const [subjects, setSubjects] = useState([]); // Array to hold subjects
  const toast = useToast(); // Chakra UI toast for notifications

  // Fetch subjects when the component mounts
  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const result = await getData('/subjects/teachers'); // Fetch the subjects for the teacher
      setSubjects(result); // Set the subjects from the API
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch subjects. Please try again later.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleAddSubject = async () => {
    if (subject.trim() === '') {
      toast({
        title: 'Error',
        description: 'Please enter a subject name.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const data = {
      name: subject,
    };

    try {
      await postData('/subjects', data); // Add the new subject via API
      setSubjects((prevSubjects) => [...prevSubjects, { name: subject }]); // Update local state
      setSubject(''); // Clear input field
      toast({
        title: 'Subject Added',
        description: `${subject} has been added.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add subject. Please try again later.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleRemoveSubject = async (subjectToRemove) => {
    try {
      console.log("Removing subject:", subjectToRemove);
      await postData('/subjects/remove', { name: subjectToRemove }); // Call API to remove subject
      setSubjects(subjects.filter((subj) => subj.name !== subjectToRemove)); // Update local state
      toast({
        title: 'Subject Removed',
        description: `${subjectToRemove} has been successfully removed.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to remove subject: ${error.message}`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="container.md" mt={10}>
      <Heading as="h1" size="lg" mb={4} textAlign="center">
        Manage Subjects
      </Heading>

      <Box mb={4} display="flex" justifyContent="space-between">
        <Input
          placeholder="Add Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          mb={2}
          flex="1"
          mr={2}
        />
        <Button colorScheme="blue" onClick={handleAddSubject}>
          Add Subject
        </Button>
      </Box>

      <List spacing={3}>
        {subjects.length > 0 ? (
          subjects.map((subj, index) => (
            <ListItem
              key={index}
              p={3}
              borderWidth="2px"
              borderRadius="md"
              boxShadow="md"
              bg="white"
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <ListIcon as={BookIcon} color="blue.500" /> {/* Changed to BookIcon */}
              <Text fontSize="lg">{subj.name}</Text>
              <IconButton
                aria-label="Delete Subject"
                icon={<DeleteIcon />}
                colorScheme="red"
                onClick={() => handleRemoveSubject(subj.name)}
              />
            </ListItem>
          ))
        ) : (
          <Text>No subjects found.</Text>
        )}
      </List>
    </Container>
  );
};

export default ManageSubjectsTeachers;
