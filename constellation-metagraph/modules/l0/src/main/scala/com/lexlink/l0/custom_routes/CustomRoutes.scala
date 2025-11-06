package com.lexlink.l0.custom_routes

import cats.effect.Async
import cats.syntax.all._
import com.lexlink.shared_data.types._
import io.circe.syntax._
import org.http4s._
import org.http4s.circe._
import org.http4s.dsl.Http4sDsl
import org.tessellation.currency.dataApplication.DataState
import org.tessellation.currency.dataApplication.dataApplication.DataApplicationCustomRoutes

/**
 * Custom HTTP API routes for querying the LexLink metagraph
 *
 * These endpoints provide rich querying capabilities over the license,
 * dispute, and training data stored in the Constellation DAG.
 */
object CustomRoutes {
  def make[F[_]: Async](): DataApplicationCustomRoutes[F] = {
    new DataApplicationCustomRoutes[F] {
      private val dsl = new Http4sDsl[F] {}
      import dsl._

      override def routes(
        state: DataState[LexLinkOnChainState, LexLinkCalculatedState]
      ): HttpRoutes[F] = {
        HttpRoutes.of[F] {
          // ===== LICENSE QUERIES =====

          case GET -> Root / "licenses" =>
            // Returns all licenses with pagination
            val licenses = state.calculated.licensesByOrderId.values.toList
            Ok(Map(
              "total" -> licenses.length,
              "licenses" -> licenses
            ).asJson)

          case GET -> Root / "licenses" / orderId =>
            // Get license by order ID with related data
            state.calculated.licensesByOrderId.get(orderId) match {
              case Some(license) =>
                val relatedDisputes = state.calculated.disputesByIpId
                  .getOrElse(license.ipId, List.empty)
                val relatedTraining = state.calculated.trainingBatchesByIpId
                  .getOrElse(license.ipId, List.empty)

                Ok(LicenseQueryResponse(
                  license = license,
                  relatedDisputes = relatedDisputes,
                  relatedTraining = relatedTraining
                ).asJson)

              case None =>
                NotFound(Map("error" -> s"License not found: $orderId").asJson)
            }

          case GET -> Root / "licenses" / "by-buyer" / buyerPrincipal =>
            // Get all licenses purchased by a buyer
            val licenses = state.calculated.licensesByBuyer
              .getOrElse(buyerPrincipal, List.empty)

            val totalSpent = licenses.map(_.amountSats).sum

            Ok(BuyerProfile(
              buyerPrincipal = buyerPrincipal,
              totalLicenses = licenses.length,
              totalSpentSats = totalSpent,
              licenses = licenses
            ).asJson)

          // ===== IP ASSET ANALYTICS =====

          case GET -> Root / "ip-assets" / ipId / "analytics" =>
            // Comprehensive analytics for an IP asset
            val licenses = state.calculated.licensesByIpId
              .getOrElse(ipId, List.empty)
            val disputes = state.calculated.disputesByIpId
              .getOrElse(ipId, List.empty)
            val training = state.calculated.trainingBatchesByIpId
              .getOrElse(ipId, List.empty)

            val totalRevenue = licenses.map(_.amountSats).sum
            val totalTrainingUnits = training.map(_.units).sum

            Ok(IpAssetAnalytics(
              ipId = ipId,
              totalLicenses = licenses.length,
              totalRevenueSats = totalRevenue,
              totalDisputes = disputes.length,
              totalTrainingUnits = totalTrainingUnits,
              licenses = licenses,
              disputes = disputes,
              trainingBatches = training
            ).asJson)

          // ===== DISPUTE QUERIES =====

          case GET -> Root / "disputes" =>
            // Returns all disputes
            val disputes = state.calculated.disputesByDisputeId.values.toList
            Ok(Map(
              "total" -> disputes.length,
              "disputes" -> disputes
            ).asJson)

          case GET -> Root / "disputes" / disputeId =>
            // Get dispute by ID
            state.calculated.disputesByDisputeId.get(disputeId) match {
              case Some(dispute) =>
                Ok(dispute.asJson)
              case None =>
                NotFound(Map("error" -> s"Dispute not found: $disputeId").asJson)
            }

          case GET -> Root / "disputes" / "by-ip" / ipId =>
            // Get all disputes for an IP asset
            val disputes = state.calculated.disputesByIpId
              .getOrElse(ipId, List.empty)
            Ok(Map(
              "ipId" -> ipId,
              "total" -> disputes.length,
              "disputes" -> disputes
            ).asJson)

          // ===== TRAINING BATCH QUERIES =====

          case GET -> Root / "training-batches" =>
            // Returns all training batches
            val batches = state.calculated.trainingBatchesByBatchId.values.toList
            Ok(Map(
              "total" -> batches.length,
              "batches" -> batches
            ).asJson)

          case GET -> Root / "training-batches" / batchId =>
            // Get training batch by ID
            state.calculated.trainingBatchesByBatchId.get(batchId) match {
              case Some(batch) =>
                Ok(batch.asJson)
              case None =>
                NotFound(Map("error" -> s"Training batch not found: $batchId").asJson)
            }

          case GET -> Root / "training-batches" / "by-ip" / ipId =>
            // Get all training batches for an IP asset
            val batches = state.calculated.trainingBatchesByIpId
              .getOrElse(ipId, List.empty)
            Ok(Map(
              "ipId" -> ipId,
              "total" -> batches.length,
              "totalUnits" -> batches.map(_.units).sum,
              "batches" -> batches
            ).asJson)

          // ===== NETWORK STATISTICS =====

          case GET -> Root / "stats" =>
            // Overall network statistics
            val uniqueIpAssets = state.calculated.licensesByIpId.keys.size
            val uniqueBuyers = state.calculated.licensesByBuyer.keys.size

            Ok(NetworkStatistics(
              totalLicenses = state.calculated.totalLicenses,
              totalDisputes = state.calculated.totalDisputes,
              totalTrainingBatches = state.calculated.totalTrainingBatches,
              totalRevenueSats = state.calculated.totalRevenueSats,
              uniqueIpAssets = uniqueIpAssets,
              uniqueBuyers = uniqueBuyers
            ).asJson)

          // ===== HEALTH CHECK =====

          case GET -> Root / "health" =>
            Ok(Map(
              "status" -> "healthy",
              "metagraph" -> "lexlink",
              "version" -> "1.0.0"
            ).asJson)
        }
      }
    }
  }
}
