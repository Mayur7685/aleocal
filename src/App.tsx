// AleoCal - Zero-Knowledge Calendar Scheduling
// Privacy-preserving calendar matching using zero-knowledge proofs on Aleo
import * as React from "react"
import { useState } from "react";
import {
  ChakraProvider,
  extendTheme,
  Button,
  HStack,
} from "@chakra-ui/react";

import { Calender } from "./components/Calender";
import { HomePage } from "./components/HomePage";
import { ConnectWallet } from "./components/ConnectWallet";
import { AddParticipants } from "./components/AddParticipants";
import { Results } from "./components/Results";
import { Finalize } from "./components/Final";
import { WalletProvider } from "./components/WalletProvider";
import { AleoAccount, MeetingResult } from "./aleo/types";

const config = {
  initialColorMode: "light",
  useSystemColorMode: false,
};

// AleoCal color palette
const theme = extendTheme({
  config,
  colors: {
    aleocal: {
      ivory: '#F5F5F5',
      coal: '#121212',
      stone: '#E3E3E3',
      pomelo: '#FFE092',
      lime: '#C4FFC2',
      cloudberry: '#FFE2FC',
      tangerine: '#FFA978',
    },
  },
  styles: {
    global: {
      body: {
        bg: '#F5F5F5',
        color: '#121212',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'normal',
        borderRadius: '20px',
        border: '1px solid',
        borderColor: '#121212',
      },
      variants: {
        solid: (props: any) => ({
          bg: props.colorScheme === 'aleocal' ? 'aleocal.pomelo' : 'aleocal.pomelo',
          color: '#121212',
          borderColor: '#121212',
          _hover: {
            bg: props.colorScheme === 'aleocal' ? 'aleocal.lime' : 'aleocal.tangerine',
          },
        }),
        outline: {
          borderColor: '#121212',
          color: '#121212',
          _hover: {
            bg: 'aleocal.stone',
          },
        },
      },
      defaultProps: {
        variant: 'solid',
      },
    },
    Input: {
      variants: {
        outline: {
          field: {
            borderColor: 'aleocal.stone',
            _hover: {
              borderColor: '#121212',
            },
            _focus: {
              borderColor: '#121212',
              boxShadow: 'none',
            },
          },
        },
      },
      defaultProps: {
        variant: 'outline',
      },
    },
    Heading: {
      baseStyle: {
        fontWeight: 'normal',
      },
    },
    Badge: {
      baseStyle: {
        fontWeight: 'normal',
      },
    },
  },
});

const appName = "AleoCal";

// Context type for Aleo integration
export interface UserContextType {
  // Account state
  aleoAccount: AleoAccount | null;
  setAleoAccount: React.Dispatch<React.SetStateAction<AleoAccount | null>>;

  // Meeting state
  meetingId: string | null;
  setMeetingId: React.Dispatch<React.SetStateAction<string | null>>;

  // Party identification (0 = host/creator, 1 = joiner)
  partyBit: number | null;
  setPartyBit: React.Dispatch<React.SetStateAction<number | null>>;

  // Other party's address
  otherPartyAddress: string | null;
  setOtherPartyAddress: React.Dispatch<React.SetStateAction<string | null>>;

  // Calendar records
  myCalendarRecord: string | null;
  setMyCalendarRecord: React.Dispatch<React.SetStateAction<string | null>>;

  // Calendar data for exchange
  myCalendarSlots: number[] | null;
  setMyCalendarSlots: React.Dispatch<React.SetStateAction<number[] | null>>;
  otherCalendarSlots: number[] | null;
  setOtherCalendarSlots: React.Dispatch<React.SetStateAction<number[] | null>>;

  // Commitment hashes
  myCommitment: string | null;
  setMyCommitment: React.Dispatch<React.SetStateAction<string | null>>;
  otherCommitment: string | null;
  setOtherCommitment: React.Dispatch<React.SetStateAction<string | null>>;

  // Ready states
  myReady: boolean;
  setMyReady: React.Dispatch<React.SetStateAction<boolean>>;
  otherReady: boolean;
  setOtherReady: React.Dispatch<React.SetStateAction<boolean>>;

  // Signaling channel for peer communication
  signalingChannel: any;
  setSignalingChannel: React.Dispatch<React.SetStateAction<any>>;

  // Result
  result: MeetingResult | null;
  setResult: React.Dispatch<React.SetStateAction<MeetingResult | null>>;

  // Salt for commitment
  salt: string | null;
  setSalt: React.Dispatch<React.SetStateAction<string | null>>;
}

export const UserContext = React.createContext<UserContextType | null>(null);

export const App = () => {
  const numPages = 6;
  const [page, setPage] = useState<number>(0);

  function handleScroll() {
    window.scrollBy({
      top: 0,
      left: window.innerWidth,
      behavior: 'smooth',
    });
  }

  const nextPage = () => {
    setPage(p => (p === (numPages-1)) ? p : (p + 1));
    handleScroll();
  }

  // Aleo account state
  const [aleoAccount, setAleoAccount] = useState<AleoAccount | null>(null);

  // Meeting state
  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [partyBit, setPartyBit] = useState<number | null>(null);
  const [otherPartyAddress, setOtherPartyAddress] = useState<string | null>(null);

  // Calendar state
  const [myCalendarRecord, setMyCalendarRecord] = useState<string | null>(null);
  const [myCalendarSlots, setMyCalendarSlots] = useState<number[] | null>(null);
  const [otherCalendarSlots, setOtherCalendarSlots] = useState<number[] | null>(null);

  // Commitment state
  const [myCommitment, setMyCommitment] = useState<string | null>(null);
  const [otherCommitment, setOtherCommitment] = useState<string | null>(null);

  // Ready states
  const [myReady, setMyReady] = useState<boolean>(false);
  const [otherReady, setOtherReady] = useState<boolean>(false);

  // Communication
  const [signalingChannel, setSignalingChannel] = useState<any>(null);

  // Result
  const [result, setResult] = useState<MeetingResult | null>(null);

  // Salt for commitment
  const [salt, setSalt] = useState<string | null>(null);

  const contextValue: UserContextType = {
    aleoAccount, setAleoAccount,
    meetingId, setMeetingId,
    partyBit, setPartyBit,
    otherPartyAddress, setOtherPartyAddress,
    myCalendarRecord, setMyCalendarRecord,
    myCalendarSlots, setMyCalendarSlots,
    otherCalendarSlots, setOtherCalendarSlots,
    myCommitment, setMyCommitment,
    otherCommitment, setOtherCommitment,
    myReady, setMyReady,
    otherReady, setOtherReady,
    signalingChannel, setSignalingChannel,
    result, setResult,
    salt, setSalt,
  };

  const canProceed = (page: number): boolean => {
    switch(page) {
      case 0: return true; // HomePage
      case 1: return aleoAccount !== null; // ConnectWallet
      case 2: return meetingId !== null; // AddParticipants
      case 3: return true; // Calendar - can always continue
      default: return true;
    }
  }

  return <ChakraProvider theme={theme}>
    <WalletProvider>
      <UserContext.Provider value={contextValue}>
        <HStack alignItems="start" overflowX="hidden" style={{transition: "all 0.2s linear"}} position={"fixed"} left={-page*window.innerWidth}>
          <HomePage appName={appName} nextPage={nextPage} />
          <ConnectWallet nextPage={nextPage} />
          <AddParticipants nextPage={nextPage} />
          <Calender nextPage={nextPage}/>
          <Results nextPage={nextPage}/>
          <Finalize />
        </HStack>

        <Button size="lg" position={"fixed"} left={10} bottom={"50%"} borderRadius={30} isDisabled={page===0} onClick={() => setPage(p => p === 0 ? p : (p - 1))}>
          {"⟨"}
        </Button>

        <Button size="lg" position={"fixed"} right={10} bottom={"50%"} borderRadius={30} isDisabled={((page===(numPages-1))) || !canProceed(page)} onClick={nextPage}>
          {"⟩"}
        </Button>
      </UserContext.Provider>
    </WalletProvider>
  </ChakraProvider>
}
