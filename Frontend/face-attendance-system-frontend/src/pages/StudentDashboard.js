import React, { useEffect, useState } from 'react';
import { Box, Container, Heading, Text, VStack, Spinner, Center, useColorMode } from '@chakra-ui/react';
import { Pie, Bar } from 'react-chartjs-2';
import { getData } from '../services/api'; // Import API function to fetch attendance data

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';

// Registering the required components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const StudentDashboard = () => {
  const [attendanceData, setAttendanceData] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true); // State to track loading status
  const { colorMode } = useColorMode(); // Get the current color mode

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true); // Set loading to true when the data fetch starts
      const response = await getData('/attendance/student');
      console.log('Attendance Data Response:', response);
      setAttendanceData(response.attendanceData || {});
      setSubjects(response.subjectsEnrolled || []);
    } catch (error) {
      console.error('Error fetching attendance data:', error.message);
    } finally {
      setLoading(false); // Set loading to false once data is fetched
    }
  };

  // Calculate overall attendance percentage for the pie chart
  const calculateOverallAttendance = () => {
    let totalClasses = 0;
    let attendedClasses = 0;

    subjects.forEach((subject) => {
      const total = attendanceData[subject]?.totalClasses || 0;
      const attended = attendanceData[subject]?.attendedClasses || 0;
      totalClasses += total;
      attendedClasses += attended;
    });

    const attendancePercentage = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0;
    return [attendancePercentage, 100 - attendancePercentage, totalClasses, attendedClasses];
  };

  const barChartData = {
    labels: subjects.length > 0 ? subjects : ['No Data Available'],
    datasets: [
      {
        label: 'Attendance Percentage',
        data: subjects.length > 0 ? subjects.map((subject) => attendanceData[subject]?.attendancePercentage || 0) : [0],
        backgroundColor: 'rgba(75, 192, 192, 0.6)', // Use a soft teal color
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        hoverBackgroundColor: 'rgba(75, 192, 192, 0.8)',
        hoverBorderColor: 'rgba(75, 192, 192, 1)',
      },
    ],
  };

  const pieChartData = {
    labels: ['Present', 'Absent'],
    datasets: [
      {
        data: calculateOverallAttendance().slice(0, 2), // Get only the attendance percentage data
        backgroundColor: ['#00A86B', '#FF6347'], // Green for present and red for absent
        hoverBackgroundColor: ['#009B63', '#E63E31'], // Darker shades for hover effect
      },
    ],
  };

  return (
    <Container maxW="container.xl" mt={10} bg={colorMode === 'dark' ? 'gray.800' : 'white'}>
      <Heading as="h1" size="2xl" mb={6} color={colorMode === 'dark' ? 'white' : 'black'}>
        Student Dashboard
      </Heading>
      {loading ? (
        <Center mt={10}>
          <Spinner size="xl" color="blue.500" />
        </Center>
      ) : (
        <VStack spacing={8}>
          <Box p={6} borderWidth="1px" borderRadius="md" boxShadow="md" bg={colorMode === 'dark' ? 'gray.700' : 'white'} width="full">
            <Text fontSize="lg" color={colorMode === 'dark' ? 'gray.200' : 'gray.700'} mb={4}>
              Welcome to your dashboard! Here you can see your attendance summary for each subject.
            </Text>

            <Heading as="h2" size="md" mb={4} color={colorMode === 'dark' ? 'white' : 'black'}>
              Attendance Overview
            </Heading>

            <Box mb={6} style={{ maxWidth: '100%', height: '400px' }}>
              <Heading as="h3" size="sm" mb={2} color={colorMode === 'dark' ? 'gray.200' : 'gray.700'}>
                Attendance Percentage by Subject
              </Heading>
              <Bar
                data={barChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  animation: {
                    duration: 500, // Animation duration
                  },
                  scales: {
                    x: {
                      title: {
                        display: true,
                        text: 'Subjects',
                        color: colorMode === 'dark' ? 'white' : 'black',
                      },
                      grid: {
                        display: true,
                        color: colorMode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)', // Fainter gridlines
                      },
                      ticks: {
                        color: colorMode === 'dark' ? 'white' : 'black', // Color for x-axis ticks
                      },
                    },
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Attendance Percentage',
                        color: colorMode === 'dark' ? 'white' : 'black',
                      },
                      max: 100,
                      grid: {
                        display: true,
                        color: colorMode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)', // Fainter gridlines
                      },
                      ticks: {
                        color: colorMode === 'dark' ? 'white' : 'black', // Color for y-axis ticks
                      },
                    },
                  },
                  plugins: {
                    tooltip: {
                      backgroundColor: colorMode === 'dark' ? '#2D3748' : '#FFFFFF', // Tooltip background color
                      titleColor: colorMode === 'dark' ? 'white' : 'black', // Tooltip title color
                      bodyColor: colorMode === 'dark' ? 'white' : 'black', // Tooltip body color
                      callbacks: {
                        label: function (context) {
                          const subject = context.label; // Get the subject name
                          const percentage = context.raw; // Get the attendance percentage
                          const totalClasses = attendanceData[subject]?.totalClasses || 0; // Get total classes
                          const attendedClasses = attendanceData[subject]?.attendedClasses || 0; // Get attended classes
                          return [
                            `${subject}: ${percentage.toFixed(2)}%`,
                            `Total Classes: ${totalClasses}`,
                            `Attended Classes: ${attendedClasses}`,
                          ];
                        },
                      },
                    },
                    datalabels: {
                      display: false, // Disable the display of data labels on the bars
                    },
                  },
                }}
                height={300} // Set a fixed height for the chart
              />
            </Box>

            <Box mb={6} style={{ maxWidth: '100%', height: '300px' }}>
              <Heading as="h3" size="sm" mb={2} color={colorMode === 'dark' ? 'gray.200' : 'gray.700'}>
                Overall Attendance Summary
              </Heading>
              <Pie 
                data={pieChartData} 
                options={{
                  maintainAspectRatio: false,
                  animation: {
                    duration: 500, // Animation duration
                  },
                  plugins: {
                    tooltip: {
                      backgroundColor: colorMode === 'dark' ? '#2D3748' : '#FFFFFF', // Tooltip background color
                      titleColor: colorMode === 'dark' ? 'white' : 'black', // Tooltip title color
                      bodyColor: colorMode === 'dark' ? 'white' : 'black', // Tooltip body color
                      callbacks: {
                        label: function (context) {
                          const label = context.label;
                          const totalClasses = calculateOverallAttendance()[2]; // Get total classes
                          const attendedClasses = calculateOverallAttendance()[3]; // Get attended classes
                          const presentPercentage = (calculateOverallAttendance()[0]).toFixed(2);
                          const absentPercentage = (calculateOverallAttendance()[1]).toFixed(2);

                          if (label === 'Present') {
                            return `Present: ${presentPercentage}% (${attendedClasses} attended out of ${totalClasses} total classes)`;
                          } else {
                            return `Absent: ${absentPercentage}% (${totalClasses - attendedClasses} absent out of ${totalClasses} total classes)`;
                          }
                        },
                      },
                    },
                    datalabels: {
                      display: false, // Disable the display of data labels on the bars
                    },
                  },
                }}
                height={200} // Set a fixed height for the Pie chart
                width={200}  // Set a fixed width for the Pie chart
              />
            </Box>
          </Box>
        </VStack>
      )}
    </Container>
  );
};

export default StudentDashboard;
