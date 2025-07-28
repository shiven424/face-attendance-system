import React from 'react';
import { Box, Flex, Heading, Text, VStack, Icon } from '@chakra-ui/react';
import { FaCamera, FaChartLine, FaUserShield } from 'react-icons/fa';

const FeaturesPage = () => {
  return (
    <Box bgGradient="linear(to-r, gray.700, black)" color="white" minH="100vh" py={10} px={8}>
      <Heading textAlign="center" mb={8} fontSize="3xl">
        Features of Our System
      </Heading>

      {/* Features List */}
      <Flex justify="center" wrap="wrap" gap={10}>
        {[
          {
            icon: FaCamera,
            title: 'AI-Powered Face Recognition',
            desc: 'Utilizes advanced algorithms for high accuracy and speed.',
          },
          {
            icon: FaChartLine,
            title: 'Real-Time Data Analysis',
            desc: 'Generate attendance reports instantly with actionable insights.',
          },
          {
            icon: FaUserShield,
            title: 'Enhanced Security',
            desc: 'Protects data with encryption and GDPR compliance.',
          },
        ].map((feature, i) => (
          <VStack
            key={i}
            bg="gray.600"
            borderRadius="md"
            p={6}
            shadow="lg"
            textAlign="center"
            maxW="xs"
            _hover={{ transform: 'scale(1.05)', shadow: 'xl', bg: 'gray.500' }}
            transition="0.3s"
          >
            <Icon as={feature.icon} boxSize={12} />
            <Text fontSize="xl" fontWeight="bold" mt={4}>
              {feature.title}
            </Text>
            <Text fontSize="sm" opacity="0.7" mt={2}>
              {feature.desc}
            </Text>
          </VStack>
        ))}
      </Flex>
    </Box>
  );
};

export default FeaturesPage;
