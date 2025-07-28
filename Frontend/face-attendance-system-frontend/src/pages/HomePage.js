import React from 'react';
import { Box, Flex, Text, Button, VStack, HStack, Image, Icon } from '@chakra-ui/react';
import { FaUsers, FaShieldAlt, FaRegClock } from 'react-icons/fa';
import { AiOutlineRight } from 'react-icons/ai';
import { BiRocket } from 'react-icons/bi';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom

const HomePage = () => {
  return (
    <Box bgGradient="linear(to-r, gray.700, black)" color="white" minH="100vh">
      {/* Header */}
      <Flex
        as="header"
        justify="space-between"
        align="center"
        px="8"
        py="2"
        bg="whiteAlpha.200"
        backdropFilter="blur(10px)"
        position="sticky"
        top="0"
        zIndex="10"
      >
        <Text fontSize="2xl" fontWeight="bold">
          Face Attendance System
        </Text>
        <HStack spacing="6">
          <Button as={Link} to="/" variant="ghost" colorScheme="whiteAlpha">
            Home
          </Button>
          <Button as={Link} to="/features" variant="ghost" colorScheme="whiteAlpha">
            Features
          </Button>
          <Button as={Link} to="/about" variant="ghost" colorScheme="whiteAlpha">
            About
          </Button>
          <Button as={Link} to="/Login" colorScheme="blue" variant="solid" px="6" rounded="full">
            Login
          </Button>
        </HStack>
      </Flex>

      {/* Hero Section */}
      <Flex
        align="center"
        justify="space-between"
        px="8"
        py="20"
        flexWrap="wrap"
        bgGradient="linear(to-r, gray.700, black, transparent)"
        position="relative"
      >
        <VStack align="start" spacing="6" maxW="lg" zIndex="1">
          <Text fontSize="4xl" fontWeight="bold" lineHeight="short">
            Revolutionize Attendance with <br />
            <Text as="span" color="blue.300">
              AI-Powered Face Recognition
            </Text>
          </Text>
          <Text fontSize="lg" opacity="0.8">
            Effortlessly track attendance with state-of-the-art face recognition technology, built for
            accuracy, speed, and security.
          </Text>
          <HStack spacing="4">
            <Button
              as={Link}
              to="/register" // Redirect to register page
              colorScheme="blue"
              size="lg"
              px="8"
              rightIcon={<AiOutlineRight />}
            >
              Get Started
            </Button>
            <Button
              as={Link}
              to="/about" // Redirect to About page
              colorScheme="whiteAlpha"
              variant="outline"
              size="lg"
              px="8"
            >
              Learn More
            </Button>
          </HStack>
        </VStack>

        {/* Image Section */}
        <Box
          position="absolute"
          top="0"
          right="0"
          bottom="0"
          w="50%"
          bg="black"
          zIndex="0"
        >
          <Image
            src="/images/face-recognition.png"
            alt="Face Recognition"
            objectFit="contain"
            w="full"
            h="full"
            opacity="0.9"
            filter="drop-shadow(0 0 15px rgba(0, 0, 0, 0.3))"
          />
        </Box>
      </Flex>

      {/* Features Section */}
      <Box bg="white" color="black" py="16" px="8" id="features">
        <Text fontSize="3xl" fontWeight="bold" textAlign="center" mb="8">
          Why Choose Our System?
        </Text>
        <Flex justify="space-between" flexWrap="wrap" gap="8">
          {[
            { icon: FaUsers, title: 'Accurate Face Recognition', desc: '99% accuracy in detecting and identifying faces.' },
            { icon: FaRegClock, title: 'Real-Time Attendance', desc: 'Instantly mark and track attendance.' },
            { icon: FaShieldAlt, title: 'Secure & Private', desc: 'Data is encrypted and privacy is ensured.' },
            { icon: BiRocket, title: 'Customizable', desc: 'Adaptable for schools, offices, and events.' },
          ].map((feature, i) => (
            <VStack
              key={i}
              bg="gray.100"
              borderRadius="md"
              p="6"
              textAlign="center"
              shadow="md"
              _hover={{ shadow: 'lg', bg: 'gray.200' }}
            >
              <Icon as={feature.icon} boxSize="8" color="blue.500" />
              <Text fontSize="xl" fontWeight="semibold">
                {feature.title}
              </Text>
              <Text fontSize="sm" color="gray.600">
                {feature.desc}
              </Text>
            </VStack>
          ))}
        </Flex>
      </Box>

      {/* How It Works Section */}
      <Box py="16" px="8" id="about">
        <Text fontSize="3xl" fontWeight="bold" textAlign="center" mb="8" color="white">
          How It Works
        </Text>
        <Flex justify="space-between" flexWrap="wrap" gap="8" color="white">
          {[
            { step: '1', title: 'Capture', desc: 'Use a camera to capture attendance seamlessly.' },
            { step: '2', title: 'Process', desc: 'AI validates and processes data in real time.' },
            { step: '3', title: 'Track', desc: 'Analyze and manage attendance data effortlessly.' },
          ].map((item, i) => (
            <VStack
              key={i}
              bg="whiteAlpha.300"
              borderRadius="md"
              p="6"
              textAlign="center"
              shadow="md"
              _hover={{ bg: 'whiteAlpha.400', transform: 'scale(1.05)' }}
              transition="0.3s"
            >
              <Text fontSize="4xl" fontWeight="bold">
                {item.step}
              </Text>
              <Text fontSize="xl" fontWeight="semibold">
                {item.title}
              </Text>
              <Text fontSize="sm">{item.desc}</Text>
            </VStack>
          ))}
        </Flex>
      </Box>

      {/* Footer */}
      <Box bg="black.700" color="white" py="8" textAlign="center">
        <Text fontSize="lg">&copy; 2024 Face Attendance System. All rights reserved.</Text>
        <HStack justify="center" mt="4" spacing="6">
          <Button as={Link} to="/about" variant="link" colorScheme="whiteAlpha">
            About
          </Button>
          <Button as={Link} to="/features" variant="link" colorScheme="whiteAlpha">
            Features
          </Button>
          <Button as={Link} to="/contact" variant="link" colorScheme="whiteAlpha">
            Contact
          </Button>
        </HStack>
      </Box>
    </Box>
  );
};

export default HomePage;
