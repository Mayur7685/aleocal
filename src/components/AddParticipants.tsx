// AddParticipants component for Aleo AleoCal
// Create or join a meeting using Aleo
import * as React from "react";
import { useState } from "react";
import {
  VStack,
  Button,
  Heading,
  Text,
  Input,
  HStack,
  useToast,
  InputGroup,
  InputLeftAddon,
} from "@chakra-ui/react";

import { UserContext, UserContextType } from "../App";
import { generateRandomField, isValidAleoAddress } from "../aleo";
import SignalingChannel from "../signalling/signaling";

interface AddParticipantsProps {
  nextPage: () => void;
}

export const AddParticipants: React.FC<AddParticipantsProps> = ({ nextPage }) => {
  const context = React.useContext(UserContext) as UserContextType;
  const {
    aleoAccount,
    setMeetingId,
    setPartyBit,
    setOtherPartyAddress,
    setSignalingChannel,
    setOtherCalendarSlots,
    setOtherReady,
  } = context;

  const [loading, setLoading] = useState(false);
  const [joinCode, setJoinCode] = useState<string>("");
  const [otherAddress, setOtherAddress] = useState<string>("");
  const toast = useToast();

  // Create a new meeting event
  const createEvent = async () => {
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
      // Generate a unique meeting ID
      const meetingIdField = await generateRandomField();
      const meetingCode = `${aleoAccount.address}:${meetingIdField}`;

      setMeetingId(meetingCode);
      setPartyBit(0); // Host is party 0

      // Set up signaling channel for peer communication
      const peerId = meetingCode;
      const signalingUrl = import.meta.env.VITE_SIGNALING_URL || "http://localhost:3030";
      const channel = new SignalingChannel(
        peerId,
        signalingUrl,
        "SIGNALING123"
      );

      channel.onMessage = (message: any) => {
        console.log("Host received message:", message);
        if (message.from === peerId + "-other") {
          if (message.message) {
            // Received other party's calendar slots
            if (message.message.calendar_slots) {
              setOtherCalendarSlots(message.message.calendar_slots);
              setOtherReady(true);
            }
            // Received other party's address
            if (message.message.address) {
              setOtherPartyAddress(message.message.address);
            }
          }
        }
      };

      channel.connect();
      setSignalingChannel(channel);

      toast({
        title: "Event Created",
        description: "Share the event code with the other party",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      setLoading(false);
      nextPage();
    } catch (error: any) {
      setLoading(false);
      toast({
        title: "Error",
        description: error.message || "Failed to create event",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Join an existing meeting event
  const joinEvent = async () => {
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

    if (!joinCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter an event code",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    try {
      // Parse the meeting code
      const parts = joinCode.trim().split(":");
      if (parts.length !== 2) {
        throw new Error("Invalid event code format");
      }

      const hostAddress = parts[0];
      if (!isValidAleoAddress(hostAddress)) {
        throw new Error("Invalid host address in event code");
      }

      setMeetingId(joinCode.trim());
      setPartyBit(1); // Joiner is party 1
      setOtherPartyAddress(hostAddress);

      toast({
        title: "Joined Event",
        description: "You have joined the meeting",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      setLoading(false);
      nextPage();
    } catch (error: any) {
      setLoading(false);
      toast({
        title: "Error",
        description: error.message || "Failed to join event",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <VStack paddingY={0} justify="space-around" alignItems="left">
      <VStack minH="100vh" justify="space-evenly" spacing={"-40vh"} minW="100vw" bg="aleocal.ivory">
        <Heading fontSize={"5xl"}>Step 2: Create or Join Meeting</Heading>

        <HStack spacing="5vw" justify="space-between">
          {/* Create Event Section */}
          <VStack alignItems="left" justifyItems="space-between" spacing="4vh" maxW="350px">
            <Text color="aleocal.coal">
              Create a new meeting event. You will receive an event code to share with the other party.
            </Text>
            <Button onClick={createEvent} isLoading={loading} loadingText="Creating...">
              Create Event
            </Button>
          </VStack>

          {/* Vertical line separator */}
          <VStack borderLeft="1px" borderColor="aleocal.stone" height="50vh" />

          {/* Join Event Section */}
          <VStack alignItems="left" justifyItems="space-between" spacing="4vh" maxW="350px">
            <Text color="aleocal.coal">
              Join an existing meeting event. Enter the event code shared by the host.
            </Text>
            <Input
              placeholder="Paste event code here"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
            />
            <Button
              isDisabled={joinCode === ""}
              onClick={joinEvent}
              isLoading={loading}
              loadingText="Joining..."
            >
              Join Event
            </Button>
          </VStack>
        </HStack>

        {aleoAccount && (
          <InputGroup size='sm' maxW="600px">
            <InputLeftAddon>Your Address</InputLeftAddon>
            <Input value={aleoAccount.address} readOnly fontSize="xs" />
          </InputGroup>
        )}
      </VStack>
    </VStack>
  );
};
