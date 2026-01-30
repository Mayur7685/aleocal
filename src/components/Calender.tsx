// Calendar component for Aleo AleoCal
// Select availability and create private calendar record
import * as React from "react"
import { useState } from "react";
import {
  VStack,
  Button,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  HStack,
  Input,
  InputGroup,
  InputLeftAddon,
  InputRightElement,
  useToast,
  Text,
} from "@chakra-ui/react"

import { UserContext, UserContextType } from "../App";
import { createCalendar, generateRandomField } from "../aleo";
import SignalingChannel from "../signalling/signaling";

const days = 1;
const hours = 8;
const maxLevel = 5;

const initialCalendar = Array(days).fill([]).map(() => Array(hours).fill(0));

interface CalenderButtonProps {
  hr: number;
  day: number;
  levelArr: number[][];
  setLevelArr: (x: any) => any;
}

const CalenderButton: React.FC<CalenderButtonProps> = ({
  hr, day, levelArr, setLevelArr
}) => {
  const level = levelArr[day][hr];

  const increaseLevel = () => {
    setLevelArr((lvlArr: number[][]) => {
      let newLvlArr = Array(days).fill([]).map(() => Array(hours).fill(0));
      for (let i = 0; i < days; i++) {
        for (let j = 0; j < hours; j++) {
          newLvlArr[i][j] = lvlArr[i][j];
        }
      }
      newLvlArr[day][hr] = (newLvlArr[day][hr] + 1) % maxLevel;
      return newLvlArr;
    });
  }

  // Color mapping for preference levels
  const levelColors = [
    "#E3E3E3", // Level 0 - Stone (unavailable)
    "#FFE092", // Level 1 - Pomelo
    "#C4FFC2", // Level 2 - Lime
    "#FFE2FC", // Level 3 - Cloudberry
    "#FFA978", // Level 4 - Tangerine
  ];

  if (level === 0)
    return (
      <Button
        width="95%"
        borderRadius="md"
        onClick={increaseLevel}
        bg={levelColors[0]}
        color="#121212"
        _hover={{ bg: "#F5F5F5" }}
      >
        ×
      </Button>
    );
  else {
    return (
      <Button
        width="95%"
        bg={levelColors[level]}
        color="#121212"
        _hover={{ opacity: 0.8 }}
        borderRadius="md"
        onClick={increaseLevel}
      >
        {level}
      </Button>
    );
  }
}

interface CalenderProps {
  nextPage: () => void;
}

export const Calender: React.FC<CalenderProps> = ({ nextPage }) => {
  const [calender, setCalender] = useState<number[][]>(initialCalendar);
  const timeslots = [
    "9am-10am",
    "10am-11am",
    "11am-12pm",
    "12pm-1pm",
    "1pm-2pm",
    "2pm-3pm",
    "3pm-4pm",
    "4pm-5pm"
  ];
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const context = React.useContext(UserContext) as UserContextType;
  const {
    aleoAccount,
    meetingId,
    partyBit,
    setMyCalendarRecord,
    setMyCalendarSlots,
    setMyReady,
    setSignalingChannel,
    signalingChannel,
    setOtherCalendarSlots,
    setOtherReady,
    setOtherPartyAddress,
    setResult,
  } = context;

  const submitCalendar = async () => {
    if (!aleoAccount) {
      toast({
        title: "Error",
        description: "Please connect your account first",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    try {
      const slots = calender.flat();

      // Generate a unique calendar ID
      const calendarId = await generateRandomField();

      // Create the calendar record locally using Aleo
      // This executes the Leo program and generates a ZK proof
      const { record, calendarId: finalCalendarId } = await createCalendar(
        aleoAccount,
        slots,
        calendarId
      );

      // Store the calendar record and slots
      setMyCalendarRecord(record);
      setMyCalendarSlots(slots);
      setMyReady(true);

      // Handle signaling based on party role
      if (partyBit === 1) {
        // Joiner: Set up signaling and send calendar to host
        const peerId = meetingId + "-other";
        const signalingUrl = import.meta.env.VITE_SIGNALING_URL || "http://localhost:3030";
        const channel = new SignalingChannel(
          peerId,
          signalingUrl,
          "SIGNALING123"
        );

        channel.onMessage = (message: any) => {
          if (message.from === meetingId) {
            if (message.message) {
              if (message.message.result !== undefined) {
                // Result received from host - store it and show on guest's screen
                const bestSlot = parseInt(message.message.result);
                setResult({
                  best_slot: bestSlot,
                  best_score: 1, // We don't get the score, just the slot
                  valid: true,
                });
              }
              if (message.message.fin) {
                nextPage();
              }
            }
          }
        };

        channel.connect();

        // Send calendar slots and address to host
        channel.sendTo(meetingId, {
          calendar_slots: slots,
          address: aleoAccount.address,
        });

        setSignalingChannel(channel);

        toast({
          title: "Calendar Submitted",
          description: "Waiting for host to compute the meeting time",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Host: Calendar stored, waiting for joiner
        toast({
          title: "Calendar Saved",
          description: "Waiting for the other party to submit their calendar",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }

      setLoading(false);
      nextPage();
    } catch (error: any) {
      setLoading(false);
      console.error("Error creating calendar:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create calendar",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }

  return (
    <VStack paddingY={0} justify="space-around" alignItems="left">
      <VStack minH="100vh" minW="100vw" justify="space-evenly" bg="aleocal.ivory">
        <Heading fontSize={"5xl"}>Step 3: Select Your Availability</Heading>

        <HStack justify="flex-start" spacing={50}>
          <InputGroup size='md' maxW="500px">
            <InputLeftAddon>Event Code</InputLeftAddon>
            <Input value={meetingId || ""} pr='4.5rem' readOnly fontSize="xs" />
            <InputRightElement width='4.5rem'>
              <Button
                size='sm'
                h='1.75rem'
                onClick={() => navigator.clipboard.writeText(meetingId || "")}
              >
                Copy
              </Button>
            </InputRightElement>
          </InputGroup>
          <Button onClick={() => setCalender(initialCalendar)}>Reset</Button>
        </HStack>

        <Text fontSize="sm" color="aleocal.coal" opacity={0.6}>
          Click on slots to toggle availability. Numbers 1-4 indicate preference level (higher = more preferred).
        </Text>

        <TableContainer>
          <Table variant='simple'>
            <Thead>
              <Tr>
                <Th>Time</Th>
                <Th>Tomorrow</Th>
              </Tr>
            </Thead>
            <Tbody>
              {timeslots.map((timeslot, h) => (
                <Tr key={h}>
                  <Td isNumeric>{timeslot}</Td>
                  {initialCalendar.map((_, d) => (
                    <Td key={d + "_" + h} padding={0}>
                      <CalenderButton
                        hr={h}
                        day={d}
                        levelArr={calender}
                        setLevelArr={setCalender}
                      />
                    </Td>
                  ))}
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>

        <Button
          onClick={submitCalendar}
          isLoading={loading}
          loadingText="Creating ZK Proof..."
          isDisabled={!aleoAccount}
        >
          Submit Calendar
        </Button>

        <Text fontSize="xs" color="aleocal.coal" opacity={0.6}>
          Your calendar will be encrypted using zero-knowledge cryptography.
          Only the common available slots will be revealed.
        </Text>
      </VStack>
    </VStack>
  );
}
