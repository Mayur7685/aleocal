// Results component for Aleo AleoCal
// Compute calendar intersection using zero-knowledge proofs
import * as React from "react";
import {
  Text,
  VStack,
  Button,
  Heading,
  InputGroup,
  InputLeftAddon,
  InputRightElement,
  Input,
  HStack,
  useToast,
  Box,
  Badge,
} from "@chakra-ui/react";
import { ReactTyped } from "react-typed";

import { UserContext, UserContextType } from "../App";
import { computeIntersectionDirect, slotIndexToTimeRange } from "../aleo";

interface ResultsProps {
  nextPage: () => void;
}

export const Results: React.FC<ResultsProps> = ({ nextPage }) => {
  const context = React.useContext(UserContext) as UserContextType;
  const {
    aleoAccount,
    meetingId,
    myCalendarRecord,
    otherCalendarSlots,
    myReady,
    otherReady,
    partyBit,
    signalingChannel,
    result,
    setResult,
  } = context;

  const [loading, setLoading] = React.useState<boolean>(false);
  const toast = useToast();

  // Status badge colors from palette
  const readyColor = "#C4FFC2"; // Lime
  const pendingColor = "#FFE092"; // Pomelo

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

  // Compute the calendar intersection
  const computeIntersection = async () => {
    if (!aleoAccount || !myCalendarRecord || !otherCalendarSlots || !meetingId) {
      toast({
        title: "Error",
        description: "Missing required data for computation",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    try {
      console.log("Computing intersection...");
      console.log("My calendar record:", myCalendarRecord);
      console.log("Other party slots:", otherCalendarSlots);

      // Notify other party that computation is starting
      if (signalingChannel) {
        signalingChannel.sendTo(meetingId + "-other", { fin: true });
      }

      // Parse meeting ID to get the field value
      const meetingIdField = meetingId.split(":")[1] || "0field";

      // Compute intersection using Aleo's zero-knowledge proof
      const computeResult = await computeIntersectionDirect(
        aleoAccount,
        myCalendarRecord,
        otherCalendarSlots,
        meetingIdField
      );

      console.log("Computation result:", computeResult);

      setResult(computeResult);

      // Send result to other party
      if (signalingChannel) {
        signalingChannel.sendTo(meetingId + "-other", {
          result: computeResult.best_slot.toString()
        });
      }

      toast({
        title: "Computation Complete",
        description: computeResult.valid
          ? `Best time: ${timeslots[computeResult.best_slot]}`
          : "No common time slot found",
        status: computeResult.valid ? "success" : "warning",
        duration: 5000,
        isClosable: true,
      });

      setLoading(false);
      nextPage();
    } catch (error: any) {
      setLoading(false);
      console.error("Computation error:", error);
      toast({
        title: "Computation Error",
        description: error.message || "Failed to compute intersection",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const isHost = partyBit === 0;
  const canCompute = isHost && myReady && otherReady && myCalendarRecord && otherCalendarSlots;

  return (
    <VStack paddingY={0} justify="space-around" alignItems="left">
      <VStack minH="100vh" minW="100vw" justify="space-evenly" bg="aleocal.ivory">
        <VStack spacing={"5vh"}>
          <Heading fontSize={"5xl"}>Step 4: Computing Result</Heading>

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

          {/* Status indicators */}
          <HStack spacing={4}>
            <Box p={4} borderRadius="md" borderWidth={1} borderColor="aleocal.stone" minW="200px">
              <VStack>
                <Text>Host (You)</Text>
                <Badge
                  bg={myReady ? readyColor : pendingColor}
                  color="aleocal.coal"
                  fontSize="md"
                  p={2}
                  borderRadius="md"
                >
                  {myReady ? "Ready" : "Pending"}
                </Badge>
              </VStack>
            </Box>

            <Box p={4} borderRadius="md" borderWidth={1} borderColor="aleocal.stone" minW="200px">
              <VStack>
                <Text>Other Party</Text>
                <Badge
                  bg={otherReady ? readyColor : pendingColor}
                  color="aleocal.coal"
                  fontSize="md"
                  p={2}
                  borderRadius="md"
                >
                  {otherReady ? "Ready" : "Pending"}
                </Badge>
              </VStack>
            </Box>
          </HStack>


          {/* Waiting messages */}
          {!isHost && !result && (
            <Text>
              Waiting for host to compute
              <ReactTyped strings={[".", "..", "..."]} typeSpeed={80} showCursor={false} loop />
            </Text>
          )}

          {isHost && !otherReady && (
            <Text>
              Waiting for other party to submit their calendar
              <ReactTyped strings={[".", "..", "..."]} typeSpeed={80} showCursor={false} loop />
            </Text>
          )}

          {/* Compute button (host only) */}
          {isHost && (
            <Button
              onClick={computeIntersection}
              isLoading={loading}
              loadingText="Computing ZK Proof..."
              isDisabled={!canCompute}
              size="lg"
              bg="aleocal.lime"
              color="aleocal.coal"
              borderColor="aleocal.coal"
              _hover={{ bg: "aleocal.cloudberry" }}
            >
              Find Common Time
            </Button>
          )}

          {/* Result display */}
          {result && (
            <Box p={6} borderRadius="lg" borderWidth={2} borderColor="aleocal.lime" bg="aleocal.cloudberry">
              <VStack spacing={3}>
                <Text fontSize="xl" color="aleocal.coal">
                  {result.valid ? "Best Meeting Time Found!" : "No Common Time Available"}
                </Text>
                {result.valid && (
                  <>
                    <Text fontSize="2xl" color="aleocal.coal">
                      {timeslots[result.best_slot]}
                    </Text>
                    <Text fontSize="sm" color="aleocal.coal" opacity={0.7}>
                      Preference Score: {result.best_score}
                    </Text>
                  </>
                )}
              </VStack>
            </Box>
          )}

          <Text fontSize="xs" color="aleocal.coal" opacity={0.6} maxW="400px" textAlign="center">
            The computation uses zero-knowledge proofs to find common slots
            without revealing your full calendar to the other party.
          </Text>
        </VStack>
      </VStack>
    </VStack>
  );
};
