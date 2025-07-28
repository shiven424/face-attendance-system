import React from 'react';
import { Box, Flex, Heading, Text, VStack, Image, HStack } from '@chakra-ui/react';
import { BiCodeBlock, BiRocket, BiCheckShield } from 'react-icons/bi';

const AboutPage = () => {
  return (
    <Box bgGradient="linear(to-r, gray.700, black)" color="white" minH="100vh" py={10} px={8}>
      {/* Hero Section */}
      <Flex align="center" justify="space-between" flexWrap="wrap" py={10} gap={8}>
        <VStack align="start" spacing={6} maxW="lg">
          <Heading fontSize="3xl" fontWeight="bold">
            About Face Attendance System
          </Heading>
          <Text fontSize="lg" opacity="0.8">
            Our mission is to revolutionize attendance management using state-of-the-art AI
            technology. With accuracy, security, and innovation at our core, we provide the most
            advanced face recognition solutions for schools, businesses, and events.
          </Text>
        </VStack>
      </Flex>

      {/* Features Section */}
      <VStack spacing={8} py={10}>
        <Heading fontSize="2xl">What Makes Us Unique</Heading>
        <HStack spacing={6} wrap="wrap" justify="center">
          {[
            {
              icon: BiRocket,
              title: 'Innovation',
              desc: 'Constantly pushing the boundaries of technology.',
            },
            {
              icon: BiCheckShield,
              title: 'Security',
              desc: 'Your data is encrypted and secured at all times.',
            },
            {
              icon: BiCodeBlock,
              title: 'Efficiency',
              desc: 'Save time and effort with automated attendance tracking.',
            },
          ].map((item, i) => (
            <VStack
              key={i}
              align="center"
              bg="gray.600"
              p={6}
              borderRadius="md"
              maxW="xs"
              shadow="lg"
              _hover={{ transform: 'scale(1.05)', bg: 'gray.500', shadow: 'xl' }}
              transition="0.3s"
            >
              <item.icon size={48} color="blue.300" />
              <Text fontSize="lg" fontWeight="bold">
                {item.title}
              </Text>
              <Text fontSize="sm" opacity="0.8" textAlign="center">
                {item.desc}
              </Text>
            </VStack>
          ))}
        </HStack>
      </VStack>
    </Box>
  );
};

export default AboutPage;
