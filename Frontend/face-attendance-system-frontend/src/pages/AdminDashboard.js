import React from 'react';
import { Box, Container, Heading, Text } from '@chakra-ui/react';

const AdminDashboard = () => {
  return (
    <Container maxW="container.xl" centerContent>
      <Box p={6} boxShadow="md" borderWidth="1px" borderRadius="md" mt={10} bg="white">
        <Heading as="h1" size="2xl" mb={4}>
          Admin Dashboard
        </Heading>
        <Text fontSize="lg" color="gray.600">
          Welcome to the Admin Dashboard. Here you can manage users, subjects, and other functionalities.
        </Text>
        {/* Admin functionalities go here */}
      </Box>
    </Container>
  );
};

export default AdminDashboard;
