// Aleo Testnet Client - Real SDK integration
// This file handles the actual Aleo SDK integration for testnet

import { aleoConfig, getNetworkUrl, isUsingMockSDK } from './aleoConfig';
import { AleoAccount, MeetingResult, DaySlots } from './types';

// SDK state
let sdkInstance: any = null;
let isWasmInitialized = false;
let initializationPromise: Promise<any> | null = null;

// SDK initialization status
export interface SDKStatus {
  isInitialized: boolean;
  isUsingMock: boolean;
  error: string | null;
}

let sdkStatus: SDKStatus = {
  isInitialized: false,
  isUsingMock: true,
  error: null,
};

/**
 * Initialize the Aleo SDK with WASM
 * This must be called before any other SDK functions
 */
export async function initializeAleoSDK(): Promise<any> {
  // Return existing instance if already initialized
  if (sdkInstance && isWasmInitialized) {
    return sdkInstance;
  }

  // Return existing initialization promise if in progress
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      // Check if we should use mock SDK
      if (isUsingMockSDK()) {
        console.log('[Aleo] Using mock SDK (configured via REACT_APP_USE_MOCK_SDK)');
        const { MockAleoSDK } = await import('./mockAleoSDK');
        sdkInstance = MockAleoSDK;
        sdkStatus = { isInitialized: true, isUsingMock: true, error: null };
        isWasmInitialized = true;
        return sdkInstance;
      }

      // Try to load the real SDK
      console.log('[Aleo] Initializing real SDK...');

      // Dynamic import of the SDK
      let sdk: any;
      try {
        // Import the SDK - WASM is initialized automatically in v0.9.15+
        // Vite handles this natively, CRA needs webpackIgnore comment
        sdk = await import('@provablehq/sdk');
      } catch (importError: any) {
        throw new Error(`SDK package not installed: ${importError.message}`);
      }

      // Test that the SDK loaded correctly by checking for Account class
      if (!sdk.Account) {
        throw new Error('SDK loaded but Account class not found');
      }

      console.log('[Aleo] SDK loaded successfully (WASM auto-initialized in v0.9.15+)');
      sdkInstance = sdk;
      isWasmInitialized = true;
      sdkStatus = { isInitialized: true, isUsingMock: false, error: null };

      return sdkInstance;
    } catch (error: any) {
      console.warn('[Aleo] Failed to initialize real SDK, falling back to mock:', error.message);

      // Fallback to mock SDK
      const { MockAleoSDK } = await import('./mockAleoSDK');
      sdkInstance = MockAleoSDK;
      isWasmInitialized = true;
      sdkStatus = {
        isInitialized: true,
        isUsingMock: true,
        error: `Real SDK failed: ${error.message}`
      };

      return sdkInstance;
    } finally {
      initializationPromise = null;
    }
  })();

  return initializationPromise;
}

/**
 * Get current SDK status
 */
export function getSDKStatus(): SDKStatus {
  return { ...sdkStatus };
}

/**
 * Check if WASM is initialized
 */
export function isSDKReady(): boolean {
  return isWasmInitialized && sdkInstance !== null;
}

/**
 * Create a new Aleo account
 */
export async function createAccount(): Promise<AleoAccount> {
  const sdk = await initializeAleoSDK();
  const account = new sdk.Account();

  return {
    privateKey: account.privateKey().to_string(),
    viewKey: account.viewKey().to_string(),
    address: account.address().to_string(),
  };
}

/**
 * Import an account from private key
 */
export async function importAccountFromKey(privateKey: string): Promise<AleoAccount> {
  const sdk = await initializeAleoSDK();
  const account = new sdk.Account({ privateKey });

  return {
    privateKey: account.privateKey().to_string(),
    viewKey: account.viewKey().to_string(),
    address: account.address().to_string(),
  };
}

/**
 * Create a ProgramManager for executing transitions
 */
export async function createProgramManager(account: AleoAccount): Promise<any> {
  const sdk = await initializeAleoSDK();
  const networkUrl = getNetworkUrl();

  // Create key provider with caching enabled
  let keyProvider;
  if (sdk.AleoKeyProvider) {
    keyProvider = new sdk.AleoKeyProvider();
    if (aleoConfig.sdk.useKeyCache) {
      keyProvider.useCache(true);
    }
  }

  // Create network client
  let networkClient;
  if (sdk.AleoNetworkClient) {
    networkClient = new sdk.AleoNetworkClient(networkUrl);
  }

  // Create record provider for the account
  let recordProvider;
  if (sdk.NetworkRecordProvider && networkClient) {
    const sdkAccount = new sdk.Account({ privateKey: account.privateKey });
    recordProvider = new sdk.NetworkRecordProvider(sdkAccount, networkClient);
  }

  // Create program manager
  const programManager = new sdk.ProgramManager(
    networkUrl,
    keyProvider,
    recordProvider
  );

  // Set the account
  programManager.setAccount(new sdk.Account({ privateKey: account.privateKey }));

  return programManager;
}

/**
 * Create a network client for querying the Aleo network
 */
export async function createNetworkClient(): Promise<any> {
  const sdk = await initializeAleoSDK();
  const networkUrl = getNetworkUrl();

  if (sdk.AleoNetworkClient) {
    return new sdk.AleoNetworkClient(networkUrl);
  }

  // Mock network client fallback
  return {
    getProgram: async (programId: string) => null,
    getTransaction: async (txId: string) => null,
    getProgramMappingValue: async (programId: string, mappingName: string, key: string) => null,
  };
}

/**
 * Execute a program transition locally (offline)
 * This runs the computation and generates a proof without submitting to the network
 * Uses programManager.run() which is the correct API for local execution with ZK proofs
 */
export async function executeOffline(
  account: AleoAccount,
  programCode: string,
  functionName: string,
  inputs: string[]
): Promise<{ outputs: string[]; proof?: string }> {
  const sdk = await initializeAleoSDK();

  // Note: Thread pool initialization requires SharedArrayBuffer which needs specific CORS headers
  // For now, we skip thread pool and run in single-threaded mode
  // This is slower but works without special server configuration
  console.log('[Aleo] Running in single-threaded mode (no thread pool)');

  const programManager = new sdk.ProgramManager();
  programManager.setAccount(new sdk.Account({ privateKey: account.privateKey }));

  try {
    console.log(`[Aleo] Executing ${functionName} locally with ZK proof...`);
    console.log('[Aleo] Inputs:', inputs);

    // Use programManager.run() for local execution with ZK proof generation
    // Signature: run(program, function_name, inputs, proveExecution, imports, keySearchParams, provingKey, verifyingKey, privateKey, offlineQuery)
    const executionResponse = await programManager.run(
      programCode,      // program source code
      functionName,     // function name to execute
      inputs,           // function inputs
      true,             // proveExecution = true to generate ZK proof
      undefined,        // imports (optional)
      undefined,        // keySearchParams (optional)
      undefined,        // provingKey (optional - will be generated)
      undefined,        // verifyingKey (optional - will be generated)
      undefined,        // privateKey (optional - uses account)
      undefined         // offlineQuery (optional)
    );

    // Handle both real SDK (ExecutionResponse with getOutputs method) and mock SDK (direct outputs object)
    let outputs: string[];
    let proof: string | undefined;

    if (typeof executionResponse.getOutputs === 'function') {
      // Real SDK - ExecutionResponse object
      outputs = executionResponse.getOutputs();
      if (executionResponse.getExecution) {
        const execution = executionResponse.getExecution();
        proof = execution ? JSON.stringify(execution) : undefined;
      }
    } else if (executionResponse.outputs) {
      // Mock SDK - direct outputs object
      outputs = executionResponse.outputs;
      proof = undefined;
    } else {
      throw new Error('Unexpected execution response format');
    }

    console.log('[Aleo] Execution outputs:', outputs);

    return {
      outputs: outputs,
      proof: proof,
    };
  } catch (error: any) {
    // Check if this is an Atomics.wait threading error
    if (error.message?.includes('Atomics.wait') || error.message?.includes('cannot be called')) {
      console.warn('[Aleo] Threading not available, falling back to mock execution');
      // Fall back to mock SDK for this execution
      const { MockProgramManager } = await import('./mockAleoSDK');
      const mockPm = new MockProgramManager();
      mockPm.setAccount({ address: () => ({ to_string: () => account.address }) } as any);
      const mockResult = await mockPm.run(programCode, functionName, inputs, true);
      console.log('[Aleo] Mock execution outputs:', mockResult.outputs);
      return { outputs: mockResult.outputs, proof: undefined };
    }
    console.error('[Aleo] Local execution failed:', error);
    throw new Error(`Local execution failed: ${error.message}`);
  }
}

/**
 * Execute a program transition and broadcast to the network
 * This submits the transaction to the Aleo testnet
 */
export async function executeOnChain(
  account: AleoAccount,
  programId: string,
  functionName: string,
  inputs: string[],
  fee: number = aleoConfig.fees.baseFee
): Promise<string> {
  const programManager = await createProgramManager(account);

  try {
    console.log(`[Aleo] Executing ${programId}::${functionName} on-chain...`);
    console.log('[Aleo] Inputs:', inputs);
    console.log('[Aleo] Fee:', fee);

    const txId = await programManager.execute(
      programId,
      functionName,
      inputs,
      fee
    );

    console.log('[Aleo] Transaction submitted:', txId);
    return txId;
  } catch (error: any) {
    console.error('[Aleo] On-chain execution failed:', error);
    throw new Error(`On-chain execution failed: ${error.message}`);
  }
}

/**
 * Wait for a transaction to be confirmed
 */
export async function waitForTransaction(
  txId: string,
  timeout: number = aleoConfig.timeouts.confirmation
): Promise<any> {
  const networkClient = await createNetworkClient();
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const transaction = await networkClient.getTransaction(txId);
      if (transaction) {
        console.log('[Aleo] Transaction confirmed:', txId);
        return transaction;
      }
    } catch (error) {
      // Transaction not found yet, continue waiting
    }

    // Wait 5 seconds before next check
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  throw new Error(`Transaction ${txId} not confirmed within ${timeout}ms`);
}

/**
 * Get a mapping value from a deployed program
 */
export async function getMappingValue(
  programId: string,
  mappingName: string,
  key: string
): Promise<string | null> {
  const networkClient = await createNetworkClient();

  try {
    const value = await networkClient.getProgramMappingValue(
      programId,
      mappingName,
      key
    );
    return value;
  } catch (error) {
    console.warn(`[Aleo] Failed to get mapping value: ${programId}::${mappingName}[${key}]`);
    return null;
  }
}

/**
 * Check if a program is deployed on the network
 */
export async function isProgramDeployed(programId: string): Promise<boolean> {
  const networkClient = await createNetworkClient();

  try {
    const program = await networkClient.getProgram(programId);
    return program !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Deploy a program to the network
 */
export async function deployProgram(
  account: AleoAccount,
  programCode: string,
  fee: number = aleoConfig.fees.deploymentFee
): Promise<string> {
  const programManager = await createProgramManager(account);

  try {
    console.log('[Aleo] Deploying program...');
    const txId = await programManager.deploy(programCode, fee);
    console.log('[Aleo] Deployment transaction:', txId);
    return txId;
  } catch (error: any) {
    console.error('[Aleo] Program deployment failed:', error);
    throw new Error(`Program deployment failed: ${error.message}`);
  }
}

/**
 * Get account balance (credits)
 */
export async function getAccountBalance(address: string): Promise<number> {
  try {
    const response = await fetch(
      `${getNetworkUrl()}/testnet/account/${address}/balance`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch balance');
    }
    const data = await response.json();
    return data.balance || 0;
  } catch (error) {
    console.warn('[Aleo] Failed to get account balance:', error);
    return 0;
  }
}

/**
 * Request testnet credits from faucet
 */
export async function requestFaucetCredits(address: string): Promise<boolean> {
  console.log('[Aleo] Testnet faucet request for:', address);
  console.log('[Aleo] Visit https://faucet.aleo.org to request testnet credits');

  // Note: Automated faucet requests may not be available
  // Users should manually request credits from the faucet website
  return false;
}

export default {
  initializeAleoSDK,
  getSDKStatus,
  isSDKReady,
  createAccount,
  importAccountFromKey,
  createProgramManager,
  createNetworkClient,
  executeOffline,
  executeOnChain,
  waitForTransaction,
  getMappingValue,
  isProgramDeployed,
  deployProgram,
  getAccountBalance,
  requestFaucetCredits,
};
