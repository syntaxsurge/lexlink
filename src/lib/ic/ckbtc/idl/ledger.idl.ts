// Minimal ICRC-1 ledger IDL tailored for ckBTC interactions

export const idlFactory = ({ IDL }: any) => {
  const Subaccount = IDL.Vec(IDL.Nat8)
  const Account = IDL.Record({
    owner: IDL.Principal,
    subaccount: IDL.Opt(Subaccount)
  })
  const Memo = IDL.Opt(IDL.Vec(IDL.Nat8))
  const TransferArg = IDL.Record({
    to: Account,
    amount: IDL.Nat,
    fee: IDL.Opt(IDL.Nat),
    from_subaccount: IDL.Opt(Subaccount),
    created_at_time: IDL.Opt(IDL.Nat64),
    memo: Memo
  })
  const TransferError = IDL.Variant({
    GenericError: IDL.Record({ message: IDL.Text, error_code: IDL.Nat }),
    TemporarilyUnavailable: IDL.Null,
    BadBurn: IDL.Record({ min_burn_amount: IDL.Nat }),
    Duplicate: IDL.Record({ duplicate_of: IDL.Nat }),
    BadFee: IDL.Record({ expected_fee: IDL.Nat }),
    CreatedInFuture: IDL.Record({ ledger_time: IDL.Nat64 }),
    TooOld: IDL.Null,
    BadTransaction: IDL.Null,
    InsufficientFunds: IDL.Record({ balance: IDL.Nat })
  })
  const TransferResult = IDL.Variant({ Ok: IDL.Nat, Err: TransferError })

  return IDL.Service({
    icrc1_symbol: IDL.Func([], [IDL.Text], ['query']),
    icrc1_decimals: IDL.Func([], [IDL.Nat8], ['query']),
    icrc1_balance_of: IDL.Func([Account], [IDL.Nat], ['query']),
    icrc1_transfer: IDL.Func([TransferArg], [TransferResult], [])
  })
}

export default idlFactory
