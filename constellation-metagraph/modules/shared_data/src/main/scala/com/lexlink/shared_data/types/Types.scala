package com.lexlink.shared_data.types

import derevo.circe.magnolia.{decoder, encoder}
import derevo.derive
import io.circe.{Decoder, Encoder}
import org.tessellation.currency.dataApplication.{DataCalculatedState, DataOnChainState, DataUpdate}
import org.tessellation.schema.SnapshotOrdinal

/**
 * LicenseUpdate - Immutable record of a license sale transaction
 *
 * This data type captures the complete state of a license transaction at the time of settlement,
 * creating an immutable audit trail on Constellation Network's DAG.
 *
 * Design Philosophy:
 * - Immutable historical snapshot (never changes after publication)
 * - Comprehensive evidence bundle (all verification artifacts)
 * - Cross-chain references (Story Protocol, ICP, Bitcoin)
 * - Compliance-ready (verifiable credentials, C2PA, attestations)
 */
@derive(decoder, encoder)
case class LicenseUpdate(
  // ===== CORE IDENTIFICATION =====
  orderId: String,               // UUID identifying this license order
  ipId: String,                  // Story Protocol IP ID (0x + 40 hex)
  contentHash: String,           // SHA-256 hash of licensed content

  // ===== LICENSE TOKEN =====
  licenseTokenId: String,        // Story Protocol ERC-721 token ID
  licenseTermsId: String,        // PIL terms template ID
  licenseContract: String,       // SPG NFT contract address
  chainId: Int,                  // EVM chain ID (1315 for Aeneid)

  // ===== BUYER INFORMATION =====
  buyerPrincipal: String,        // Internet Identity principal
  mintTo: String,                // Ethereum address receiving license token

  // ===== PAYMENT TRACKING =====
  paymentMode: String,           // "ckbtc" or "btc"
  amountSats: Long,              // Payment amount in satoshis
  paymentReference: String,      // BTC txid or ckBTC block reference
  ckbtcSubaccount: Option[String], // ICRC-1 subaccount (if ckBTC payment)
  ckbtcBlockIndex: Option[Long],   // ckBTC ledger block index

  // ===== EVIDENCE & ATTESTATIONS =====
  attestationHash: String,       // Hash of ICP canister attestation
  c2paHash: String,              // Hash of C2PA provenance bundle
  c2paArchiveUri: Option[String], // IPFS CID of C2PA zip archive
  vcHash: String,                // Hash of W3C Verifiable Credential

  // ===== COMPLIANCE METRICS =====
  complianceScore: Int,          // 0-100 composite compliance score
  trainingUnits: Long,           // AI training units consumed (if applicable)

  // ===== TEMPORAL TRACKING =====
  timestamp: Long,               // Unix milliseconds when license completed
  fundedAt: Option[Long],        // Unix milliseconds when payment confirmed

  // ===== METADATA =====
  network: String,               // Bitcoin network ("mainnet" or "testnet")
  ipMetadataHash: String,        // Hash of Story Protocol IP metadata
  nftMetadataHash: String        // Hash of NFT metadata JSON
) extends DataUpdate

/**
 * DisputeUpdate - Immutable record of a copyright dispute filing
 */
@derive(decoder, encoder)
case class DisputeUpdate(
  disputeId: String,             // UUID identifying this dispute
  ipId: String,                  // Story Protocol IP ID being disputed
  targetTag: String,             // Dispute category (e.g., "COPYRIGHT_INFRINGEMENT")
  evidenceCid: String,           // IPFS CID of dispute evidence
  txHash: String,                // Story Protocol dispute transaction hash
  evidenceHash: String,          // SHA-256 hash of evidence payload
  status: String,                // Dispute status ("PENDING", "RESOLVED", etc.)
  livenessSeconds: Long,         // Time window for dispute resolution
  bond: Long,                    // Dispute bond amount (if applicable)
  timestamp: Long                // Unix milliseconds when dispute filed
) extends DataUpdate

/**
 * TrainingBatchUpdate - Immutable record of AI training data usage
 */
@derive(decoder, encoder)
case class TrainingBatchUpdate(
  batchId: String,               // UUID identifying this training batch
  ipId: String,                  // Story Protocol IP ID used for training
  units: Long,                   // Number of training units consumed
  evidenceHash: String,          // SHA-256 hash of training evidence
  timestamp: Long                // Unix milliseconds when batch recorded
) extends DataUpdate

/**
 * LexLinkOnChainState - List of all updates received by the metagraph
 *
 * This represents the raw append-only log of all data submissions.
 * Consensus is achieved on this state across Constellation validators.
 */
@derive(decoder, encoder)
case class LexLinkOnChainState(
  licenses: List[LicenseUpdate],
  disputes: List[DisputeUpdate],
  trainingBatches: List[TrainingBatchUpdate]
) extends DataOnChainState

/**
 * LexLinkCalculatedState - Queryable materialized view of the data
 *
 * This state is derived from OnChainState and optimized for efficient queries.
 * Maps enable O(1) lookups by various keys.
 */
@derive(decoder, encoder)
case class LexLinkCalculatedState(
  // Primary indices (O(1) lookups)
  licensesByOrderId: Map[String, LicenseUpdate],        // orderId -> license
  licensesByIpId: Map[String, List[LicenseUpdate]],    // ipId -> all licenses for that IP
  licensesByBuyer: Map[String, List[LicenseUpdate]],   // buyerPrincipal -> all licenses

  disputesByDisputeId: Map[String, DisputeUpdate],     // disputeId -> dispute
  disputesByIpId: Map[String, List[DisputeUpdate]],    // ipId -> all disputes for that IP

  trainingBatchesByBatchId: Map[String, TrainingBatchUpdate], // batchId -> batch
  trainingBatchesByIpId: Map[String, List[TrainingBatchUpdate]], // ipId -> all training batches

  // Aggregate statistics
  totalLicenses: Long,
  totalDisputes: Long,
  totalTrainingBatches: Long,
  totalRevenueSats: Long
) extends DataCalculatedState

object LexLinkCalculatedState {
  def empty: LexLinkCalculatedState = LexLinkCalculatedState(
    licensesByOrderId = Map.empty,
    licensesByIpId = Map.empty,
    licensesByBuyer = Map.empty,
    disputesByDisputeId = Map.empty,
    disputesByIpId = Map.empty,
    trainingBatchesByBatchId = Map.empty,
    trainingBatchesByIpId = Map.empty,
    totalLicenses = 0,
    totalDisputes = 0,
    totalTrainingBatches = 0,
    totalRevenueSats = 0
  )
}

/**
 * Query response types for custom API endpoints
 */
@derive(decoder, encoder)
case class LicenseQueryResponse(
  license: LicenseUpdate,
  relatedDisputes: List[DisputeUpdate],
  relatedTraining: List[TrainingBatchUpdate]
)

@derive(decoder, encoder)
case class IpAssetAnalytics(
  ipId: String,
  totalLicenses: Int,
  totalRevenueSats: Long,
  totalDisputes: Int,
  totalTrainingUnits: Long,
  licenses: List[LicenseUpdate],
  disputes: List[DisputeUpdate],
  trainingBatches: List[TrainingBatchUpdate]
)

@derive(decoder, encoder)
case class BuyerProfile(
  buyerPrincipal: String,
  totalLicenses: Int,
  totalSpentSats: Long,
  licenses: List[LicenseUpdate]
)

@derive(decoder, encoder)
case class NetworkStatistics(
  totalLicenses: Long,
  totalDisputes: Long,
  totalTrainingBatches: Long,
  totalRevenueSats: Long,
  uniqueIpAssets: Int,
  uniqueBuyers: Int
)
