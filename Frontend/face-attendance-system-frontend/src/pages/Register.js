import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  Heading,
  Text,
  useToast,
} from '@chakra-ui/react';
import { postData } from '../services/api'; // Import the generic function

const RegisterPage = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const toast = useToast(); // Chakra UI toast for notifications

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email || !role || !fullName || !password) {
      toast({
        title: 'Error',
        description: 'All fields are required!',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const data = {
      name: fullName,
      email: email,
      password: password,
      role: role,
    };

    try {
      const result = await postData('/register', data); // Use the generic function
      toast({
        title: 'Registration Successful',
        description: result.message,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="sm" centerContent>
      <Box p={6} boxShadow="md" borderWidth="1px" borderRadius="md" mt={10}>
        <Heading as="h1" size="lg" mb={4}>
          Register
        </Heading>
        <form onSubmit={handleRegister}>
          <FormControl mb={4} isRequired>
            <FormLabel>Full Name</FormLabel>
            <Input
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </FormControl>
          <FormControl mb={4} isRequired>
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormControl>
          <FormControl mb={4} isRequired>
            <FormLabel>Password</FormLabel>
            <Input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormControl>
          <FormControl mb={4} isRequired>
            <FormLabel>Role</FormLabel>
            <Input
              type="text"
              placeholder="Enter your role (e.g., student, teacher)"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </FormControl>
          <Button type="submit" colorScheme="blue" width="full">
            Register
          </Button>
        </form>
      </Box>
    </Container>
  );
};

export default RegisterPage;
