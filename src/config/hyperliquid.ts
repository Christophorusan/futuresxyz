// Builder Codes configuration
// Your builder address — must have >= 100 USDC in Hyperliquid perps account
export const BUILDER_ADDRESS = '0xb76b5d0b58B21B8d0cca42051AA0e16066f7dd70' as const

// Builder fee in tenths of basis points (30 = 3 bps = 0.03%)
export const BUILDER_FEE = 30

// API URLs
export const HL_API_URL = 'https://api.hyperliquid.xyz'
export const HL_WS_URL = 'wss://api.hyperliquid.xyz/ws'

// Testnet (use during development)
export const HL_TESTNET_API_URL = 'https://api.hyperliquid-testnet.xyz'
export const HL_TESTNET_WS_URL = 'wss://api.hyperliquid-testnet.xyz/ws'

// Toggle testnet mode
export const USE_TESTNET = false

export const API_URL = USE_TESTNET ? HL_TESTNET_API_URL : HL_API_URL
export const WS_URL = USE_TESTNET ? HL_TESTNET_WS_URL : HL_WS_URL
