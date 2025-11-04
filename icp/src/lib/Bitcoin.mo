import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Debug "mo:base/Debug";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Nat8 "mo:base/Nat8";
import Principal "mo:base/Principal";
import Text "mo:base/Text";

import Ripemd160 "../vendor/Ripemd160";
import Segwit "../vendor/Segwit";
import Sha256 "../vendor/Sha256";

module {
  public type Network = { #mainnet; #testnet };

  public type Utxo = {
    outpoint : OutPoint;
    value : Nat64;
    height : Nat32;
  };

  public type OutPoint = {
    txid : [Nat8];
    vout : Nat32;
  };

  public type UtxosFilter = {
    #minConfirmations : Nat32;
    #page : [Nat8];
  };

  public type GetUtxosArgs = {
    address : Text;
    filter : ?UtxosFilter;
  };

  public type GetUtxosResponse = {
    utxos : [Utxo];
    tip_block_hash : [Nat8];
    tip_height : Nat32;
    next_page : ?[Nat8];
  };

  type ManagementNetwork = {
    #mainnet;
    #testnet;
  };

  type ManagementFilter = {
    #min_confirmations : Nat32;
    #page : Blob;
  };

  type ManagementUtxo = {
    outpoint : {
      txid : Blob;
      vout : Nat32;
    };
    value : Nat64;
    height : Nat32;
  };

  type ManagementGetUtxosRequest = {
    address : Text;
    network : ManagementNetwork;
    filter : ?ManagementFilter;
  };

  type ManagementGetUtxosResponse = {
    utxos : [ManagementUtxo];
    tip_block_hash : Blob;
    tip_height : Nat32;
    next_page : ?Blob;
  };

  type ManagementCanisterActor = actor {
    bitcoin_get_utxos : ManagementGetUtxosRequest -> async ManagementGetUtxosResponse;
  };

  let MANAGEMENT_CANISTER : ManagementCanisterActor = actor ("aaaaa-aa");

  type EcdsaKeyId = {
    curve : { #secp256k1 };
    name : Text;
  };

  type EcdsaPublicKeyArgs = {
    canister_id : ?Principal;
    derivation_path : [Blob];
    key_id : EcdsaKeyId;
  };

  type EcdsaPublicKeyResponse = {
    public_key : Blob;
    chain_code : Blob;
  };

  type EcdsaCanisterActor = actor {
    ecdsa_public_key : EcdsaPublicKeyArgs -> async EcdsaPublicKeyResponse;
  };

  let ECDSA_ACTOR : EcdsaCanisterActor = actor ("aaaaa-aa");

  let GET_UTXOS_COST_CYCLES : Nat = 10_000_000_000;

  func toManagementNetwork(network : Network) : ManagementNetwork {
    switch (network) {
      case (#mainnet) { #mainnet };
      case (#testnet) { #testnet };
    };
  };

  func toManagementFilter(filter : UtxosFilter) : ManagementFilter {
    switch (filter) {
      case (#minConfirmations(confirms)) {
        #min_confirmations(confirms);
      };
      case (#page(bytes)) {
        #page(Blob.fromArray(bytes));
      };
    };
  };

  func fromManagementUtxo(utxo : ManagementUtxo) : Utxo {
    {
      outpoint = {
        txid = Blob.toArray(utxo.outpoint.txid);
        vout = utxo.outpoint.vout;
      };
      value = utxo.value;
      height = utxo.height;
    };
  };

  public func get_utxos(network : Network, args : GetUtxosArgs) : async GetUtxosResponse {
    let request : ManagementGetUtxosRequest = {
      address = args.address;
      network = toManagementNetwork(network);
      filter = switch (args.filter) {
        case null { null };
        case (?value) { ?toManagementFilter(value) };
      };
    };

    let response = await (with cycles = GET_UTXOS_COST_CYCLES) MANAGEMENT_CANISTER.bitcoin_get_utxos(request);

    {
      utxos = Array.map<ManagementUtxo, Utxo>(response.utxos, fromManagementUtxo);
      tip_block_hash = Blob.toArray(response.tip_block_hash);
      tip_height = response.tip_height;
      next_page = switch (response.next_page) {
        case null { null };
        case (?page) { ?Blob.toArray(page) };
      };
    };
  };

  public func get_p2wpkh_address(
    network : Network,
    keyName : Text,
    derivationPath : [[Nat8]],
  ) : async Text {
    let derivationBlobs = Array.map<[Nat8], Blob>(derivationPath, Blob.fromArray);

    let publicKeyResponse = await ECDSA_ACTOR.ecdsa_public_key({
      canister_id = null;
      derivation_path = derivationBlobs;
      key_id = {
        curve = #secp256k1;
        name = keyName;
      };
    });

    let publicKeyBytes = Blob.toArray(publicKeyResponse.public_key);
    let sha256Digest = Blob.toArray(Sha256.fromArray(#sha256, publicKeyBytes));
    let hash160 = Ripemd160.hash(sha256Digest);

    let hrp : Text = switch (network) {
      case (#mainnet) { "bc" };
      case (#testnet) { "tb" };
    };

    switch (Segwit.encode(hrp, { version = 0; program = hash160 })) {
      case (#ok(address)) { address };
      case (#err(message)) {
        Debug.trap("Failed to encode P2WPKH address: " # message);
      };
    };
  };
}
