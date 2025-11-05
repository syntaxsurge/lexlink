import { type Identity } from '@dfinity/agent'
import { Principal } from '@dfinity/principal'

import { ledgerActor, minterActor } from '@/lib/ic/ckbtc/client'
import { toLedgerAccount } from '@/lib/ic/ckbtc/utils'

export async function getLedgerMetadata(identity?: Identity) {
  const ledger = await ledgerActor(identity)
  const [symbol, decimals] = await Promise.all([
    ledger.icrc1_symbol(),
    ledger.icrc1_decimals()
  ])
  return {
    symbol,
    decimals: Number(decimals)
  }
}

export async function getAccountBalance({
  owner,
  subaccount,
  identity
}: {
  owner: string
  subaccount?: Uint8Array
  identity?: Identity
}) {
  const ledger = await ledgerActor(identity)
  const account = toLedgerAccount(Principal.fromText(owner), subaccount)
  const balance = await ledger.icrc1_balance_of(account)
  return BigInt(balance)
}

export async function requestCkbtcDepositAddress({
  owner,
  subaccount,
  identity
}: {
  owner: string
  subaccount?: Uint8Array
  identity?: Identity
}) {
  const minter = await minterActor(identity)
  const principal = Principal.fromText(owner)
  const args = {
    owner: [principal],
    subaccount: subaccount ? [Array.from(subaccount)] : []
  }
  const address: string = await minter.get_btc_address(args)
  return address
}

export async function updateCkbtcDepositBalance({
  owner,
  subaccount,
  identity
}: {
  owner: string
  subaccount?: Uint8Array
  identity?: Identity
}) {
  const minter = await minterActor(identity)
  const principal = Principal.fromText(owner)
  const args = {
    owner: [principal],
    subaccount: subaccount ? [Array.from(subaccount)] : []
  }
  return minter.update_balance(args)
}

export async function transferCkbtc({
  identity,
  toOwner,
  toSubaccount,
  amount,
  fromSubaccount,
  memo
}: {
  identity: Identity
  toOwner: Principal
  toSubaccount?: Uint8Array
  amount: bigint
  fromSubaccount?: Uint8Array
  memo?: Uint8Array
}) {
  const ledger = await ledgerActor(identity)
  const args = {
    to: toLedgerAccount(toOwner, toSubaccount),
    amount,
    fee: [],
    from_subaccount: fromSubaccount ? [Array.from(fromSubaccount)] : [],
    created_at_time: [],
    memo: memo ? [[...memo]] : []
  }
  return ledger.icrc1_transfer(args)
}
