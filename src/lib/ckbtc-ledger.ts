import { Actor, HttpAgent } from '@dfinity/agent'
import { IDL } from '@dfinity/candid'
import { Principal } from '@dfinity/principal'

import { env } from '@/lib/env'

type LedgerAccount = {
  owner: Principal
  subaccount?: number[]
}

type LedgerActor = {
  icrc1_symbol: () => Promise<string>
  icrc1_decimals: () => Promise<number>
  icrc1_balance_of: (account: { owner: Principal; subaccount: [] | [number[]] }) => Promise<bigint>
}

type UpdateBalanceOk = {
  minted_amount: bigint
}

type UpdateBalanceErr =
  | { TemporarilyUnavailable: null }
  | { AlreadyProcessing: null }
  | { NoNewUtxos: null }
  | { GenericError: { error_message: string; error_code: bigint } }

type UpdateBalanceResponse =
  | { Ok: UpdateBalanceOk }
  | { Err: UpdateBalanceErr }

type MinterActor = {
  get_btc_address: (args: {
    owner: [] | [Principal]
    subaccount: [] | [number[]]
    network: [] | [{ Mainnet: null } | { Testnet: null }]
  }) => Promise<string>
  update_balance: (args: {
    owner: [] | [Principal]
    subaccount: [] | [number[]]
  }) => Promise<UpdateBalanceResponse>
}

type BtcNetwork = 'mainnet' | 'testnet'

let cachedAgent: HttpAgent | null = null
let cachedLedger: LedgerActor | null = null
let cachedMinter: MinterActor | null = null

function ensureEnv(value: string | undefined, key: string): string {
  if (!value) {
    throw new Error(`${key} is required to interact with the ckBTC ledger`)
  }
  return value
}

async function getAgent(): Promise<HttpAgent> {
  if (cachedAgent) {
    return cachedAgent
  }

  const agent = new HttpAgent({
    host: env.ICP_HOST
  })

  if (
    env.ICP_HOST.includes('127.0.0.1') ||
    env.ICP_HOST.includes('localhost')
  ) {
    await agent.fetchRootKey()
  }

  cachedAgent = agent
  return agent
}

const ledgerIdlFactory = ({ IDL: candid }: { IDL: typeof IDL }) => {
  const Subaccount = candid.Vec(candid.Nat8)
  const Account = candid.Record({
    owner: candid.Principal,
    subaccount: candid.Opt(Subaccount)
  })
  return candid.Service({
    icrc1_symbol: candid.Func([], [candid.Text], ['query']),
    icrc1_decimals: candid.Func([], [candid.Nat8], ['query']),
    icrc1_balance_of: candid.Func([Account], [candid.Nat], ['query'])
  })
}

const minterIdlFactory = ({ IDL: candid }: { IDL: typeof IDL }) => {
  const Subaccount = candid.Vec(candid.Nat8)
  const Network = candid.Variant({
    Mainnet: candid.Null,
    Testnet: candid.Null
  })
  return candid.Service({
    get_btc_address: candid.Func(
      [
        candid.Record({
          owner: candid.Opt(candid.Principal),
          subaccount: candid.Opt(Subaccount),
          network: candid.Opt(Network)
        })
      ],
      [candid.Text],
      []
    ),
    update_balance: candid.Func(
      [
        candid.Record({
          owner: candid.Opt(candid.Principal),
          subaccount: candid.Opt(Subaccount)
        })
      ],
      [
        candid.Variant({
          Ok: candid.Record({
            minted_amount: candid.Nat
          }),
          Err: candid.Variant({
            TemporarilyUnavailable: candid.Null,
            AlreadyProcessing: candid.Null,
            NoNewUtxos: candid.Null,
            GenericError: candid.Record({
              error_message: candid.Text,
              error_code: candid.Nat
            })
          })
        })
      ],
      []
    )
  })
}

async function getLedgerActor(): Promise<LedgerActor> {
  if (cachedLedger) {
    return cachedLedger
  }

  const canisterId = ensureEnv(env.CKBTC_LEDGER_CANISTER_ID, 'CKBTC_LEDGER_CANISTER_ID')
  const agent = await getAgent()
  cachedLedger = Actor.createActor<LedgerActor>(ledgerIdlFactory as any, {
    agent,
    canisterId
  })
  return cachedLedger
}

async function getMinterActor(): Promise<MinterActor> {
  if (cachedMinter) {
    return cachedMinter
  }

  const canisterId = ensureEnv(env.CKBTC_MINTER_CANISTER_ID, 'CKBTC_MINTER_CANISTER_ID')
  const agent = await getAgent()
  cachedMinter = Actor.createActor<MinterActor>(minterIdlFactory as any, {
    agent,
    canisterId
  })
  return cachedMinter
}

function toAccount(owner: string, subaccount?: Uint8Array): LedgerAccount {
  return {
    owner: Principal.fromText(owner),
    subaccount: subaccount ? Array.from(subaccount) : undefined
  }
}

export async function fetchLedgerMetadata() {
  const ledger = await getLedgerActor()
  const [symbol, decimals] = await Promise.all([
    ledger.icrc1_symbol(),
    ledger.icrc1_decimals()
  ])
  return {
    symbol,
    decimals: Number(decimals)
  }
}

export async function getAccountBalance(
  owner: string,
  subaccount?: Uint8Array
): Promise<bigint> {
  const ledger = await getLedgerActor()
  const account = toAccount(owner, subaccount)
  return ledger.icrc1_balance_of({
    owner: account.owner,
    subaccount: account.subaccount ? [account.subaccount] : []
  })
}

export async function requestCkbtcDepositAddress({
  owner,
  subaccount,
  network
}: {
  owner: string
  subaccount?: Uint8Array
  network: BtcNetwork
}) {
  const minter = await getMinterActor()
  const ownerPrincipal = Principal.fromText(owner)
  const response = await minter.get_btc_address({
    owner: [ownerPrincipal],
    subaccount: subaccount ? [Array.from(subaccount)] : [],
    network: [
      network === 'mainnet' ? { Mainnet: null } : { Testnet: null }
    ]
  })
  return response
}

export async function updateCkbtcBalance({
  owner,
  subaccount
}: {
  owner: string
  subaccount?: Uint8Array
}): Promise<UpdateBalanceResponse> {
  const minter = await getMinterActor()
  const ownerPrincipal = Principal.fromText(owner)
  return minter.update_balance({
    owner: [ownerPrincipal],
    subaccount: subaccount ? [Array.from(subaccount)] : []
  })
}

export function formatTokenAmount(
  value: bigint,
  decimals: number
): string {
  if (value === 0n) return '0'
  const divisor = BigInt(10) ** BigInt(decimals)
  const whole = value / divisor
  const fraction = value % divisor
  if (fraction === 0n) {
    return whole.toString()
  }
  const fractionStr = fraction.toString().padStart(decimals, '0').replace(/0+$/, '')
  return `${whole.toString()}.${fractionStr}`
}

export type UpdateBalanceSummary =
  | { mintedAmount: bigint; pending: false }
  | { mintedAmount: bigint; pending: true }

export function summarizeUpdateBalance(
  response: UpdateBalanceResponse
): UpdateBalanceSummary {
  if ('Ok' in response) {
    return { mintedAmount: response.Ok.minted_amount, pending: false }
  }
  const err = response.Err
  if ('NoNewUtxos' in err) {
    return { mintedAmount: 0n, pending: true }
  }
  let detail = 'update_balance failed'
  if ('TemporarilyUnavailable' in err) {
    detail = 'ckBTC minter temporarily unavailable'
  } else if ('AlreadyProcessing' in err) {
    detail = 'ckBTC minter already processing this request'
  } else if ('GenericError' in err) {
    detail = `ckBTC minter error ${err.GenericError.error_code}: ${err.GenericError.error_message}`
  }
  throw new Error(detail)
}
