// Minimal ckBTC minter IDL for deposit address allocation and balance updates
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const idlFactory = ({ IDL }: any) => {
  const Subaccount = IDL.Vec(IDL.Nat8)
  const GetAddressArgs = IDL.Record({
    owner: IDL.Opt(IDL.Principal),
    subaccount: IDL.Opt(Subaccount)
  })
  const UpdateArgs = GetAddressArgs
  const UpdateError = IDL.Variant({
    NoNewUtxos: IDL.Null,
    TemporarilyUnavailable: IDL.Null,
    AlreadyProcessing: IDL.Null,
    GenericError: IDL.Record({
      error_message: IDL.Text,
      error_code: IDL.Nat
    })
  })
  const UpdateResult = IDL.Variant({
    Ok: IDL.Nat,
    Err: UpdateError
  })

  return IDL.Service({
    get_btc_address: IDL.Func([GetAddressArgs], [IDL.Text], []),
    update_balance: IDL.Func([UpdateArgs], [UpdateResult], [])
  })
}

export default idlFactory
