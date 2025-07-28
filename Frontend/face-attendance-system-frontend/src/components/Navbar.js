import React from 'react';
import { Box, Flex, Button, Heading, Spacer, HStack, useColorMode, IconButton } from '@chakra-ui/react';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // Import useLocation
import { MoonIcon, SunIcon } from '@chakra-ui/icons';

const Navbar = ({ role, isAuthenticated, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation(); // Get the current location
  const { colorMode, toggleColorMode } = useColorMode();

  const handleLogout = () => {
    console.log('Logging out...');
    onLogout();
    navigate('/');
  };

  // Hide Navbar on the homepage
  if (location.pathname === '/') {
    return null;
  }

  return (
    <Box bg={colorMode === 'light' ? 'gray.100' : 'gray.900'} px={4}>
      <Flex h={16} alignItems="center" justifyContent="space-between">
        <HStack spacing={8} alignItems="center">
        <Heading
            as={Link} // Wrap Heading with Link
            to="/"
            size="md"
            color={colorMode === 'light' ? 'black' : 'white'}
            _hover={{ textDecoration: 'none' }} // Remove underline on hover
          >
            Face Attendance System
          </Heading>

          {isAuthenticated && role === 'teacher' && (
            <HStack spacing={4}>
              <Button as={Link} to="/take-attendance" variant="ghost">
                Take Attendance
              </Button>
              <Button as={Link} to="/manage-subjects-teachers" variant="ghost">
                Manage Subjects
              </Button>
            </HStack>
          )}
        </HStack>

        <Spacer />

        <HStack spacing={4} alignItems="center">
          {isAuthenticated ? (
            <>
              {role === 'admin' && (
                <HStack spacing={4}>
                  <Button as={Link} to="/admin-dashboard" variant="ghost">
                    Admin Dashboard
                  </Button>
                  <Button as={Link} to="/manage-teachers" variant="ghost">
                    Manage Teachers
                  </Button>
                  <Button as={Link} to="/manage-students" variant="ghost">
                    Manage Students
                  </Button>
                  <Button as={Link} to="/manage-subjects-admins" variant="ghost">
                    Manage Subjects
                  </Button>
                </HStack>
              )}

              {role === 'student' && (
                <HStack spacing={4}>
                  <Button as={Link} to="/student-dashboard" variant="ghost">
                    Student Dashboard
                  </Button>
                  <Button as={Link} to="/face-registration" variant="ghost">
                    Register Subjects
                  </Button>
                </HStack>
              )}

              {role === 'teacher' && (
                <Button as={Link} to="/teacher-dashboard" variant="ghost">
                  Teacher Dashboard
                </Button>
              )}

              <Button colorScheme="red" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button as={Link} to="/Login" variant="solid" colorScheme="blue">
                Login
              </Button>
              <Button as={Link} to="/register" variant="outline" colorScheme="blue">
                Register
              </Button>
            </>
          )}

          {/* <IconButton
            icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            onClick={toggleColorMode}
            variant="ghost"
            aria-label="Toggle theme"
          /> */}
        </HStack>
      </Flex>
    </Box>
  );
};

export default Navbar;
