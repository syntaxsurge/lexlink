package com.lexlink.shared_data.validations

import cats.data.ValidatedNec
import cats.syntax.all._
import com.lexlink.shared_data.types._
import org.tessellation.currency.dataApplication.DataApplicationValidationType
import org.tessellation.currency.dataApplication.dataApplication.DataApplicationValidationErrorOr

object Validations {
  type ValidationResult[A] = ValidatedNec[String, A]

  /**
   * Validates a LicenseUpdate before accepting it into the metagraph
   */
  def validateLicenseUpdate(
    license: LicenseUpdate,
    state: Option[LexLinkCalculatedState]
  ): DataApplicationValidationErrorOr[Unit] = {
    List(
      validateOrderId(license.orderId),
      validateStoryIpId(license.ipId),
      validateContentHash(license.contentHash),
      validateEthereumAddress(license.licenseContract, "licenseContract"),
      validateEthereumAddress(license.mintTo, "mintTo"),
      validateChainId(license.chainId),
      validateAmountSats(license.amountSats),
      validateHash(license.attestationHash, "attestationHash"),
      validateHash(license.c2paHash, "c2paHash"),
      validateHash(license.vcHash, "vcHash"),
      validateHash(license.ipMetadataHash, "ipMetadataHash"),
      validateHash(license.nftMetadataHash, "nftMetadataHash"),
      validateComplianceScore(license.complianceScore),
      validateTimestamp(license.timestamp),
      validateNotDuplicateLicense(license.orderId, state)
    ).reduceLeft(_ combine _)
  }

  /**
   * Validates a DisputeUpdate before accepting it into the metagraph
   */
  def validateDisputeUpdate(
    dispute: DisputeUpdate,
    state: Option[LexLinkCalculatedState]
  ): DataApplicationValidationErrorOr[Unit] = {
    List(
      validateDisputeId(dispute.disputeId),
      validateStoryIpId(dispute.ipId),
      validateCid(dispute.evidenceCid),
      validateHash(dispute.evidenceHash, "evidenceHash"),
      validateTimestamp(dispute.timestamp),
      validateNotDuplicateDispute(dispute.disputeId, state)
    ).reduceLeft(_ combine _)
  }

  /**
   * Validates a TrainingBatchUpdate before accepting it into the metagraph
   */
  def validateTrainingBatchUpdate(
    batch: TrainingBatchUpdate,
    state: Option[LexLinkCalculatedState]
  ): DataApplicationValidationErrorOr[Unit] = {
    List(
      validateBatchId(batch.batchId),
      validateStoryIpId(batch.ipId),
      validateUnits(batch.units),
      validateHash(batch.evidenceHash, "evidenceHash"),
      validateTimestamp(batch.timestamp),
      validateNotDuplicateBatch(batch.batchId, state)
    ).reduceLeft(_ combine _)
  }

  // ===== INDIVIDUAL VALIDATORS =====

  private def validateOrderId(orderId: String): DataApplicationValidationErrorOr[Unit] =
    if (orderId.nonEmpty && orderId.length <= 128)
      ().validNec
    else
      "orderId must be non-empty and <= 128 characters".invalidNec

  private def validateDisputeId(disputeId: String): DataApplicationValidationErrorOr[Unit] =
    if (disputeId.nonEmpty && disputeId.length <= 128)
      ().validNec
    else
      "disputeId must be non-empty and <= 128 characters".invalidNec

  private def validateBatchId(batchId: String): DataApplicationValidationErrorOr[Unit] =
    if (batchId.nonEmpty && batchId.length <= 128)
      ().validNec
    else
      "batchId must be non-empty and <= 128 characters".invalidNec

  private def validateStoryIpId(ipId: String): DataApplicationValidationErrorOr[Unit] =
    if (ipId.matches("^0x[a-fA-F0-9]{40}$"))
      ().validNec
    else
      s"ipId must be a valid Ethereum address (0x + 40 hex chars), got: $ipId".invalidNec

  private def validateContentHash(hash: String): DataApplicationValidationErrorOr[Unit] =
    if (hash.matches("^0x[a-fA-F0-9]{64}$") || hash.matches("^[a-fA-F0-9]{64}$"))
      ().validNec
    else
      s"contentHash must be a valid SHA-256 hash (64 hex chars), got: $hash".invalidNec

  private def validateHash(hash: String, fieldName: String): DataApplicationValidationErrorOr[Unit] =
    if (hash.matches("^0x[a-fA-F0-9]{64}$") || hash.matches("^[a-fA-F0-9]{64}$"))
      ().validNec
    else
      s"$fieldName must be a valid SHA-256 hash (64 hex chars), got: $hash".invalidNec

  private def validateEthereumAddress(address: String, fieldName: String): DataApplicationValidationErrorOr[Unit] =
    if (address.matches("^0x[a-fA-F0-9]{40}$"))
      ().validNec
    else
      s"$fieldName must be a valid Ethereum address (0x + 40 hex chars), got: $address".invalidNec

  private def validateCid(cid: String): DataApplicationValidationErrorOr[Unit] =
    if (cid.startsWith("Qm") || cid.startsWith("bafy") || cid.startsWith("ipfs://"))
      ().validNec
    else
      s"evidenceCid must be a valid IPFS CID, got: $cid".invalidNec

  private def validateChainId(chainId: Int): DataApplicationValidationErrorOr[Unit] =
    if (chainId > 0)
      ().validNec
    else
      s"chainId must be positive, got: $chainId".invalidNec

  private def validateAmountSats(amount: Long): DataApplicationValidationErrorOr[Unit] =
    if (amount > 0)
      ().validNec
    else
      s"amountSats must be positive, got: $amount".invalidNec

  private def validateUnits(units: Long): DataApplicationValidationErrorOr[Unit] =
    if (units >= 0)
      ().validNec
    else
      s"units must be non-negative, got: $units".invalidNec

  private def validateComplianceScore(score: Int): DataApplicationValidationErrorOr[Unit] =
    if (score >= 0 && score <= 100)
      ().validNec
    else
      s"complianceScore must be between 0 and 100, got: $score".invalidNec

  private def validateTimestamp(timestamp: Long): DataApplicationValidationErrorOr[Unit] = {
    val now = System.currentTimeMillis()
    if (timestamp > 0 && timestamp <= now + 60000) // Allow 1 minute clock skew
      ().validNec
    else
      s"timestamp must be positive and not in future, got: $timestamp (now: $now)".invalidNec
  }

  private def validateNotDuplicateLicense(
    orderId: String,
    state: Option[LexLinkCalculatedState]
  ): DataApplicationValidationErrorOr[Unit] = {
    state match {
      case Some(s) if s.licensesByOrderId.contains(orderId) =>
        s"License with orderId $orderId already exists in metagraph".invalidNec
      case _ =>
        ().validNec
    }
  }

  private def validateNotDuplicateDispute(
    disputeId: String,
    state: Option[LexLinkCalculatedState]
  ): DataApplicationValidationErrorOr[Unit] = {
    state match {
      case Some(s) if s.disputesByDisputeId.contains(disputeId) =>
        s"Dispute with disputeId $disputeId already exists in metagraph".invalidNec
      case _ =>
        ().validNec
    }
  }

  private def validateNotDuplicateBatch(
    batchId: String,
    state: Option[LexLinkCalculatedState]
  ): DataApplicationValidationErrorOr[Unit] = {
    state match {
      case Some(s) if s.trainingBatchesByBatchId.contains(batchId) =>
        s"Training batch with batchId $batchId already exists in metagraph".invalidNec
      case _ =>
        ().validNec
    }
  }
}
