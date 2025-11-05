import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Bool "mo:base/Bool";
import Error "mo:base/Error";
import Int "mo:base/Int";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Nat8 "mo:base/Nat8";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Trie "mo:base/Trie";

import Prim "mo:prim";

import Bitcoin "../lib/Bitcoin";
import Sha256 "../vendor/Sha256";

persistent actor btc_escrow {
  let versionText : Text = "0.1.0-dev";

  type PaymentMode = { #btc; #ckbtc };

  type PaymentRecord = {
    mode : PaymentMode;
    txid : Text;
    confirmed : Bool;
    mintedAmount : ?Nat;
    blockIndex : ?Nat;
  };

  type Utxo = {
    outpoint : {
      txid : [Nat8];
      vout : Nat32;
    };
    value : Nat64;
    height : Nat32;
  };

  type UtxoStatus = {
    #ValueTooSmall : Utxo;
    #Tainted : Utxo;
    #Checked : Utxo;
    #Minted : {
      block_index : Nat64;
      minted_amount : Nat64;
      utxo : Utxo;
    };
  };

  type PendingUtxo = {
    outpoint : {
      txid : [Nat8];
      vout : Nat32;
    };
    value : Nat64;
    confirmations : Nat32;
  };

  type SuspendedReason = {
    #ValueTooSmall;
    #Quarantined;
  };

  type SuspendedUtxo = {
    utxo : Utxo;
    reason : SuspendedReason;
    earliest_retry : Nat64;
  };

  type UpdateBalanceError = {
    #NoNewUtxos : {
      current_confirmations : ?Nat32;
      required_confirmations : Nat32;
      pending_utxos : ?[PendingUtxo];
      suspended_utxos : ?[SuspendedUtxo];
    };
    #AlreadyProcessing;
    #TemporarilyUnavailable : Text;
    #GenericError : {
      error_message : Text;
      error_code : Nat64;
    };
  };

  type UpdateBalanceResult = {
    #Ok : [UtxoStatus];
    #Err : UpdateBalanceError;
  };

  type CkbtcAccountArgs = {
    owner : ?Principal;
    subaccount : ?Blob;
  };

  type CkbtcMinter = actor {
    get_btc_address : (CkbtcAccountArgs) -> async Text;
    update_balance : (CkbtcAccountArgs) -> async UpdateBalanceResult;
  };

  func parseMode(raw : Text) : PaymentMode {
    let lower = Text.toLowercase(raw);
    if (lower == "btc") {
      #btc
    } else {
      #ckbtc
    }
  };

  func modeText(mode : PaymentMode) : Text {
    switch (mode) {
      case (#btc) { "btc" };
      case (#ckbtc) { "ckbtc" };
    }
  };

  let defaultMode : PaymentMode = switch (Prim.envVar("PAYMENT_MODE")) {
    case (?value) { parseMode(value) };
    case null { #ckbtc };
  };

  let ckbtcMinterId : ?Text = Prim.envVar("CKBTC_MINTER_CANISTER_ID");

  let keyName : Text = switch (Prim.envVar("ECDSA_KEY_NAME")) {
    case (?value) { value };
    case null { "dfx_test_key" };
  };

  let canisterPrincipal : Principal = Prim.principalOfActor(this);

  let btcNetwork : Bitcoin.Network = switch (Prim.envVar("BTC_NETWORK")) {
    case (?value) {
      let normalized = Text.toLowercase(value);
      if (normalized == "mainnet") {
        #mainnet
      } else {
        #testnet
      }
    };
    case null { #testnet };
  };

  var addressBook : Trie.Trie<Text, Text> = Trie.empty();
  var payments : Trie.Trie<Text, PaymentRecord> = Trie.empty();
  var orderModes : Trie.Trie<Text, PaymentMode> = Trie.empty();
  var ckbtcSubaccounts : Trie.Trie<Text, Blob> = Trie.empty();

  func key(orderId : Text) : Trie.Key<Text> {
    { hash = Text.hash(orderId); key = orderId }
  };

  func rememberMode(orderId : Text, mode : PaymentMode) {
    orderModes := Trie.put(orderModes, key(orderId), Text.equal, mode).0;
  };

  func resolveMode(orderId : Text) : PaymentMode {
    switch (Trie.find(orderModes, key(orderId), Text.equal)) {
      case (?mode) { mode };
      case null { defaultMode };
    }
  };

  func ckbtcMinter() : CkbtcMinter {
    switch (ckbtcMinterId) {
      case (?id) { actor (id) };
      case null {
        Prim.trap("CKBTC_MINTER_CANISTER_ID not configured");
      };
    }
  };

  func ensureCkbtcSubaccount(orderId : Text) : Blob {
    switch (Trie.find(ckbtcSubaccounts, key(orderId), Text.equal)) {
      case (?existing) { existing };
      case null {
        let hash = Sha256.fromArray(#sha256, Blob.toArray(Text.encodeUtf8(orderId)));
        let blob = Blob.fromArray(hash);
        ckbtcSubaccounts := Trie.put(ckbtcSubaccounts, key(orderId), Text.equal, blob).0;
        blob
      };
    }
  };

  func hexDigit(n : Nat) : Text {
    switch n {
      case 0 { "0" };
      case 1 { "1" };
      case 2 { "2" };
      case 3 { "3" };
      case 4 { "4" };
      case 5 { "5" };
      case 6 { "6" };
      case 7 { "7" };
      case 8 { "8" };
      case 9 { "9" };
      case 10 { "a" };
      case 11 { "b" };
      case 12 { "c" };
      case 13 { "d" };
      case 14 { "e" };
      case _ { "f" };
    }
  };

  func bytesToHex(bytes : [Nat8]) : Text {
    Array.foldLeft<Nat8, Text>(
      bytes,
      "",
      func(acc, byte) {
        let value = Nat8.toNat(byte);
        acc # hexDigit(value / 16) # hexDigit(value % 16)
      },
    )
  };

  func describeUpdateBalanceError(err : UpdateBalanceError) : Text {
    switch (err) {
      case (#NoNewUtxos(details)) {
        let required = Nat32.toText(details.required_confirmations);
        let current = switch (details.current_confirmations) {
          case (?value) { Nat32.toText(value) };
          case null { "0" };
        };
        "No new ckBTC deposits available (" # current # "/" # required # " confirmations)"
      };
      case (#AlreadyProcessing) {
        "ckBTC minter is already processing this account, retry shortly"
      };
      case (#TemporarilyUnavailable(message)) {
        "ckBTC minter temporarily unavailable: " # message
      };
      case (#GenericError(info)) {
        "ckBTC minter error (" # Nat64.toText(info.error_code) # "): " # info.error_message
      };
    }
  };

  func summarizeMint(statuses : [UtxoStatus]) : { minted : Nat; blockIndex : Nat; txids : Text } {
    var total : Nat = 0;
    var block : Nat = 0;
    var txids : Text = "";
    for (status in statuses.vals()) {
      switch (status) {
        case (#Minted(data)) {
          total += Nat64.toNat(data.minted_amount);
          block := Nat64.toNat(data.block_index);
          let txidHex = bytesToHex(data.utxo.outpoint.txid);
          txids := if (txids == "") {
            txidHex
          } else {
            txids # "," # txidHex
          };
        };
        case _ {};
      }
    };
    { minted = total; blockIndex = block; txids }
  };

  public shared func request_deposit_address(orderId : Text, requestedMode : ?Text) : async Text {
    let mode = switch (requestedMode) {
      case (?value) { parseMode(value) };
      case null { resolveMode(orderId) };
    };
    rememberMode(orderId, mode);

    switch (Trie.find(addressBook, key(orderId), Text.equal)) {
      case (?address) { address };
      case null {
        switch (mode) {
          case (#btc) {
            let derivationPath : [[Nat8]] = [
              Blob.toArray(Text.encodeUtf8("lexlink")),
              Blob.toArray(Text.encodeUtf8(orderId)),
            ];
            let address = await Bitcoin.get_p2wpkh_address(btcNetwork, keyName, derivationPath);
            addressBook := Trie.put(addressBook, key(orderId), Text.equal, address).0;
            address
          };
          case (#ckbtc) {
            let subaccount = ensureCkbtcSubaccount(orderId);
            let address = await ckbtcMinter().get_btc_address({
              owner = ?canisterPrincipal;
              subaccount = ?subaccount;
            });
            addressBook := Trie.put(addressBook, key(orderId), Text.equal, address).0;
            address
          };
        }
      };
    }
  };

  public shared func confirm_payment(orderId : Text, txid : Text) : async () {
    let mode = resolveMode(orderId);
    if (mode == #ckbtc) {
      throw Error.reject("Order uses ckBTC mode; invoke settle_ckbtc instead");
    };

    let address = switch (Trie.find(addressBook, key(orderId), Text.equal)) {
      case (?addr) { addr };
      case null { throw Error.reject("Unknown order identifier") };
    };

    let utxosResponse = await Bitcoin.get_utxos(
      btcNetwork,
      {
        address = address;
        filter = null;
      },
    );

    let matched = Array.foldLeft<Bitcoin.Utxo, Bool>(
      utxosResponse.utxos,
      false,
      func(acc, utxo) {
        acc or Text.equal(bytesToHex(utxo.outpoint.txid), Text.toLowercase(txid))
      },
    );

    payments := Trie.put(
      payments,
      key(orderId),
      Text.equal,
      {
        mode = #btc;
        txid = txid;
        confirmed = matched;
        mintedAmount = null;
        blockIndex = null;
      },
    ).0
  };

  public shared func settle_ckbtc(orderId : Text) : async { minted : Nat; blockIndex : Nat; txids : Text } {
    let mode = resolveMode(orderId);
    if (mode != #ckbtc) {
      throw Error.reject("Order uses native BTC mode; call confirm_payment");
    };

    ignore ensureCkbtcSubaccount(orderId);
    let subaccount = switch (Trie.find(ckbtcSubaccounts, key(orderId), Text.equal)) {
      case (?blob) { blob };
      case null { Blob.fromArray([]) };
    };

    let result = await ckbtcMinter().update_balance({
      owner = ?canisterPrincipal;
      subaccount = ?subaccount;
    });

    switch (result) {
      case (#Ok(statuses)) {
        let summary = summarizeMint(statuses);
        if (summary.minted == 0) {
          throw Error.reject("No ckBTC minted yet; wait for confirmations");
        };
        payments := Trie.put(
          payments,
          key(orderId),
          Text.equal,
          {
            mode = #ckbtc;
            txid = summary.txids;
            confirmed = true;
            mintedAmount = ?summary.minted;
            blockIndex = if (summary.blockIndex == 0) {
              null
            } else {
              ?summary.blockIndex
            };
          },
        ).0;
        summary
      };
      case (#Err(err)) {
        throw Error.reject(describeUpdateBalanceError(err))
      };
    }
  };

  public query func attestation(orderId : Text) : async Text {
    let address = switch (Trie.find(addressBook, key(orderId), Text.equal)) {
      case (?addr) { addr };
      case null { "" };
    };

    let payment = Trie.find(payments, key(orderId), Text.equal);
    let now = Int.toText(Time.now());
    let mode = modeText(resolveMode(orderId));

    let txid = switch (payment) {
      case (?record) { record.txid };
      case null { "" };
    };

    let confirmed = switch (payment) {
      case (?record) {
        if (record.confirmed) {
          "true"
        } else {
          "false"
        }
      };
      case null { "false" };
    };

    let minted = switch (payment) {
      case (?record) {
        switch (record.mintedAmount) {
          case (?amount) { Nat.toText(amount) };
          case null { "" };
        }
      };
      case null { "" };
    };

    let blockIndex = switch (payment) {
      case (?record) {
        switch (record.blockIndex) {
          case (?idx) { Nat.toText(idx) };
          case null { "" };
        }
      };
      case null { "" };
    };

    "{" #
      "\"orderId\":\"" # orderId # "\"," #
      "\"paymentMode\":\"" # mode # "\"," #
      "\"btcAddress\":\"" # address # "\"," #
      "\"btcTxId\":\"" # txid # "\"," #
      "\"confirmed\":" # confirmed # "," #
      "\"ckbtcMintedSats\":\"" # minted # "\"," #
      "\"ckbtcBlockIndex\":\"" # blockIndex # "\"," #
      "\"timestamp\":\"" # now # "\"" #
    "}"
  };

  public query func version() : async Text {
    versionText
  };
}
