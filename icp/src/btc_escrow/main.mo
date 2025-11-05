import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Bool "mo:base/Bool";
import Error "mo:base/Error";
import Int "mo:base/Int";
import Nat8 "mo:base/Nat8";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Trie "mo:base/Trie";

import Prim "mo:prim";

import Bitcoin "../lib/Bitcoin";

persistent actor btc_escrow {
  let versionText : Text = "0.1.0-dev";

  let keyName : Text = switch (Prim.envVar("ECDSA_KEY_NAME")) {
    case (?value) { value };
    case null { "dfx_test_key" };
  };
  func key(orderId : Text) : Trie.Key<Text> {
    { hash = Text.hash(orderId); key = orderId }
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

  var addressBook : Trie.Trie<Text, Text> = Trie.empty();
  var payments : Trie.Trie<Text, { txid : Text; confirmed : Bool }> = Trie.empty();
  var network : Bitcoin.Network = #testnet;

  public shared func request_deposit_address(orderId : Text) : async Text {
    switch (Trie.find(addressBook, key(orderId), Text.equal)) {
      case (?address) { address };
      case null {
        let derivationPath : [[Nat8]] = [
          Blob.toArray(Text.encodeUtf8("lexlink")),
          Blob.toArray(Text.encodeUtf8(orderId)),
        ];
        let address = await Bitcoin.get_p2wpkh_address(network, keyName, derivationPath);
        addressBook := Trie.put(addressBook, key(orderId), Text.equal, address).0;
        address
      };
    }
  };

  public shared func confirm_payment(orderId : Text, txid : Text) : async () {
    let address = switch (Trie.find(addressBook, key(orderId), Text.equal)) {
      case (?addr) { addr };
      case null { throw Error.reject("Unknown order identifier") };
    };

    let utxosResponse = await Bitcoin.get_utxos(
      network,
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
        txid = txid;
        confirmed = matched;
      },
    ).0
  };

  public query func attestation(orderId : Text) : async Text {
    let address = switch (Trie.find(addressBook, key(orderId), Text.equal)) {
      case (?addr) { addr };
      case null { "" };
    };

    let payment = Trie.find(payments, key(orderId), Text.equal);
    let now = Int.toText(Time.now());

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

    "{" #
      "\"orderId\":\"" # orderId # "\"," #
      "\"btcAddress\":\"" # address # "\"," #
      "\"btcTxId\":\"" # txid # "\"," #
      "\"confirmed\":" # confirmed # "," #
      "\"timestamp\":\"" # now # "\"" #
    "}"
  };

  public query func version() : async Text {
    versionText
  };
}
