import React, { useState } from 'react';
import { Box, Button, Container, FormControl, FormLabel, Input, Heading, Text, useToast } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { postData } from '../services/api'; // Import the generic function

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate(); // Initialize the navigate function
  const toast = useToast(); // Chakra UI toast for notifications

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: 'Error',
        description: 'Email and password are required!',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const data = {
      email,
      password,
    };

    try {
      const result = await postData('/login', data); // Use the generic function
      console.log('Server response:', result); // Debugging log

      if (result) { // Assuming your API returns a success flag
        const role = result.role; // Assume the role is returned from the API
        console.log('Login successful, role:', role); // Log the role
        onLogin(role); // Set the authentication status and role

        // Redirect based on user type
        if (role === 'teacher') {
          navigate('/teacher-dashboard');
        } else if (role === 'student') {
          navigate('/student-dashboard');
        } else if (role === 'admin') {
          navigate('/admin-dashboard');
        }
      } else {
        toast({
          title: 'Login Failed',
          description: result.message || 'Email or password is incorrect.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error during login:', error);
      toast({
        title: 'Error',
        description: error.message || 'An error occurred during login.',
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
          Login
        </Heading>
        <form onSubmit={handleLogin}>
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
          <Button type="submit" colorScheme="blue" width="full">
            Login
          </Button>
        </form>
      </Box>
    </Container>
  );
};

export default LoginPage;
