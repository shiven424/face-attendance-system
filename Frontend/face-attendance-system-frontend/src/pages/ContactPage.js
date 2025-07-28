import React from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Input,
  Textarea,
  Button,
  VStack,
  HStack,
  Icon,
} from '@chakra-ui/react';
import { FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

const ContactPage = () => {
  return (
    <Box bgGradient="linear(to-r, gray.700, black)" color="white" minH="100vh" py={10} px={8}>
      <Heading textAlign="center" mb={8} fontSize="3xl">
        Get In Touch
      </Heading>
      <Flex
        direction={{ base: 'column', md: 'row' }}
        justify="space-between"
        align="start"
        bg="whiteAlpha.300"
        borderRadius="md"
        p={8}
        gap={10}
      >
        {/* Contact Info */}
        <VStack align="start" spacing={6} flex="1">
          <Text fontSize="lg">
            Have questions or feedback? Reach out to us, and we’ll get back to you as soon as
            possible!
          </Text>
          <HStack spacing={4} align="center">
            <Icon as={FaPhone} boxSize={6} color="blue.300" />
            <Text>Rohit: +91 9748381345,</Text>
            <Text>Shiven: +91 9467970424</Text>
          </HStack>
          <HStack spacing={4} align="center">
            <Icon as={FaEnvelope} boxSize={6} color="blue.300" />
            <Text>h20240268@pilani.bits-pilani.ac.in</Text>
          </HStack>
          <HStack spacing={4} align="center">
            <Icon as={FaMapMarkerAlt} boxSize={6} color="blue.300" />
            <Text>Bits Pilani</Text>
          </HStack>
        </VStack>

        {/* Contact Form */}
        <VStack spacing={4} flex="1" bg="white" borderRadius="md" p={6} shadow="md" color="black">
          <Input placeholder="Your Name" size="lg" variant="outline" />
          <Input placeholder="Your Email" size="lg" variant="outline" />
          <Textarea placeholder="Your Message" size="lg" resize="vertical" />
          <Button colorScheme="blue" size="lg" width="full">
            Submit
          </Button>
        </VStack>
      </Flex>
    </Box>
  );
};

export default ContactPage;
