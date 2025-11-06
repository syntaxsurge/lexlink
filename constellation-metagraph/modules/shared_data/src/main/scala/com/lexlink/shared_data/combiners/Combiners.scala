package com.lexlink.shared_data.combiners

import cats.effect.Sync
import cats.syntax.all._
import com.lexlink.shared_data.types._
import org.tessellation.currency.dataApplication.DataState
import org.tessellation.currency.dataApplication.dataApplication.DataApplicationBlock

object Combiners {
  /**
   * Combines a new DataApplicationBlock into the existing state
   *
   * This function:
   * 1. Appends updates to OnChainState (append-only log)
   * 2. Rebuilds CalculatedState from the updated OnChainState
   * 3. Updates aggregate statistics
   */
  def combineBlock[F[_]: Sync](
    oldState: DataState[LexLinkOnChainState, LexLinkCalculatedState],
    block: DataApplicationBlock
  ): F[DataState[LexLinkOnChainState, LexLinkCalculatedState]] = {
    Sync[F].delay {
      // Extract updates from block
      val updates = block.updates

      // Separate updates by type
      val newLicenses = updates.collect { case l: LicenseUpdate => l }
      val newDisputes = updates.collect { case d: DisputeUpdate => d }

      // Update OnChainState (append-only)
      val newOnChainState = LexLinkOnChainState(
        licenses = oldState.onChain.licenses ++ newLicenses,
        disputes = oldState.onChain.disputes ++ newDisputes
      )

      // Rebuild CalculatedState from scratch (for simplicity; could be optimized)
      val newCalculatedState = buildCalculatedState(newOnChainState)

      DataState(newOnChainState, newCalculatedState)
    }
  }

  /**
   * Builds CalculatedState from OnChainState
   *
   * This materializes all indices and aggregates for efficient querying.
   */
  private def buildCalculatedState(
    onChain: LexLinkOnChainState
  ): LexLinkCalculatedState = {
    // Build license indices
    val licensesByOrderId = onChain.licenses.map(l => l.orderId -> l).toMap

    val licensesByIpId = onChain.licenses
      .groupBy(_.ipId)
      .view
      .mapValues(_.toList)
      .toMap

    val licensesByBuyer = onChain.licenses
      .groupBy(_.buyerPrincipal)
      .view
      .mapValues(_.toList)
      .toMap

    // Build dispute indices
    val disputesByDisputeId = onChain.disputes.map(d => d.disputeId -> d).toMap

    val disputesByIpId = onChain.disputes
      .groupBy(_.ipId)
      .view
      .mapValues(_.toList)
      .toMap

    // Calculate aggregates
    val totalRevenueSats = onChain.licenses.map(_.amountSats).sum

    LexLinkCalculatedState(
      licensesByOrderId = licensesByOrderId,
      licensesByIpId = licensesByIpId,
      licensesByBuyer = licensesByBuyer,
      disputesByDisputeId = disputesByDisputeId,
      disputesByIpId = disputesByIpId,
      totalLicenses = onChain.licenses.length.toLong,
      totalDisputes = onChain.disputes.length.toLong,
      totalRevenueSats = totalRevenueSats
    )
  }
}
