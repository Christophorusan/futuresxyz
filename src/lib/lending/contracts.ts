import { parseAbi, type Address } from 'viem'

export const protocols = {
  hyperlend: {
    name: 'HyperLend', pool: '0x00a89d7a5a02160f20150ebea7a2b5e4879a1a8b',
    provider: '0x72c98246a98bfe64022a3190e7710e157497170c',
    data: '0x5481bf8d3946e6a3168640c1d7523eb59f055a29',
    source: 'https://docs.hyperlend.finance/developer-documentation/contract-addresses',
  },
} as const satisfies Record<string, { name: string; pool: Address; provider: Address; data: Address; source: string }>
export type ProtocolId = keyof typeof protocols
export type LendingAction = 'supply' | 'withdraw' | 'borrow' | 'repay'
export const registryAbi = parseAbi([
  'function getPool() view returns (address)',
  'function getPriceOracle() view returns (address)',
])
export const poolAbi = parseAbi([
  'function getReservesList() view returns (address[])',
  'function getUserAccountData(address user) view returns (uint256 totalCollateralBase,uint256 totalDebtBase,uint256 availableBorrowsBase,uint256 currentLiquidationThreshold,uint256 ltv,uint256 healthFactor)',
  'function supply(address asset,uint256 amount,address onBehalfOf,uint16 referralCode)',
  'function withdraw(address asset,uint256 amount,address to) returns (uint256)',
  'function borrow(address asset,uint256 amount,uint256 interestRateMode,uint16 referralCode,address onBehalfOf)',
  'function repay(address asset,uint256 amount,uint256 interestRateMode,address onBehalfOf) returns (uint256)',
])
export const dataAbi = parseAbi([
  'function ADDRESSES_PROVIDER() view returns (address)',
  'function getAllReservesTokens() view returns ((string symbol,address tokenAddress)[])',
  'function getReserveConfigurationData(address asset) view returns (uint256 decimals,uint256 ltv,uint256 liquidationThreshold,uint256 liquidationBonus,uint256 reserveFactor,bool usageAsCollateralEnabled,bool borrowingEnabled,bool stableBorrowRateEnabled,bool isActive,bool isFrozen)',
  'function getReserveData(address asset) view returns (uint256 unbacked,uint256 accruedToTreasuryScaled,uint256 totalAToken,uint256 totalStableDebt,uint256 totalVariableDebt,uint256 liquidityRate,uint256 variableBorrowRate,uint256 stableBorrowRate,uint256 averageStableBorrowRate,uint256 liquidityIndex,uint256 variableBorrowIndex,uint40 lastUpdateTimestamp)',
  'function getReserveTokensAddresses(address asset) view returns (address aTokenAddress,address stableDebtTokenAddress,address variableDebtTokenAddress)',
  'function getReserveCaps(address asset) view returns (uint256 borrowCap,uint256 supplyCap)',
  'function getPaused(address asset) view returns (bool)',
  'function getUserReserveData(address asset,address user) view returns (uint256 currentATokenBalance,uint256 currentStableDebt,uint256 currentVariableDebt,uint256 principalStableDebt,uint256 scaledVariableDebt,uint256 stableBorrowRate,uint256 liquidityRate,uint40 stableRateLastUpdated,bool usageAsCollateralEnabled)',
])
export const oracleAbi = parseAbi([
  'function getAssetPrice(address asset) view returns (uint256)',
  'function BASE_CURRENCY_UNIT() view returns (uint256)',
])
