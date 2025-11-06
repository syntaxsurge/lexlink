package com.lexlink.l0

import cats.effect.{IO, Resource}
import cats.syntax.all._
import com.lexlink.l0.custom_routes.CustomRoutes
import com.lexlink.shared_data.combiners.Combiners
import com.lexlink.shared_data.serializers.Serializers._
import com.lexlink.shared_data.types._
import com.lexlink.shared_data.validations.Validations
import com.monovore.decline.Opts
import com.monovore.decline.effect.CommandIOApp
import org.tessellation.BuildInfo
import org.tessellation.currency.dataApplication._
import org.tessellation.currency.dataApplication.dataApplication._
import org.tessellation.currency.l0.CurrencyL0App
import org.tessellation.schema.cluster.ClusterId
import org.tessellation.schema.semver.{MetagraphVersion, TessellationVersion}

/**
 * LexLink Metagraph L0 Node
 *
 * This is the entry point for the Metagraph L0 layer, which:
 * - Serves as the query API for license and dispute data
 * - Coordinates with Data L1 nodes for consensus
 * - Exposes custom HTTP endpoints for data access
 */
object Main extends CurrencyL0App(
  "lexlink-l0",
  "LexLink Metagraph L0 node",
  ClusterId("lexlink-metagraph-l0"),
  version = MetagraphVersion.unsafeFrom(org.tessellation.BuildInfo.version)
) {
  override def dataApplication: Option[Resource[IO, BaseDataApplicationL0Service[IO]]] =
    makeBaseDataApplicationL0Service(
      new DataApplicationL0Service[IO, LexLinkOnChainState, LexLinkCalculatedState] {
        override def genesis: DataState[LexLinkOnChainState, LexLinkCalculatedState] =
          DataState(
            LexLinkOnChainState(
              licenses = List.empty,
              disputes = List.empty
            ),
            LexLinkCalculatedState.empty
          )

        override def validateUpdate(
          update: DataUpdate
        )(implicit context: L0NodeContext[IO]): IO[DataApplicationValidationErrorOr[Unit]] = {
          val currentState = context.getLastState.map(_.calculated)

          update match {
            case license: LicenseUpdate =>
              currentState.map(state => Validations.validateLicenseUpdate(license, state))

            case dispute: DisputeUpdate =>
              currentState.map(state => Validations.validateDisputeUpdate(dispute, state))

            case _ =>
              IO.pure(s"Unknown update type: ${update.getClass.getSimpleName}".invalidNec)
          }
        }

        override def validateData(
          state: DataState[LexLinkOnChainState, LexLinkCalculatedState],
          updates: List[DataUpdate]
        )(implicit context: L0NodeContext[IO]): IO[DataApplicationValidationErrorOr[Unit]] = {
          // Validate each update individually
          updates.traverse { update =>
            validateUpdate(update)
          }.map(_.sequence.void)
        }

        override def combine(
          oldState: DataState[LexLinkOnChainState, LexLinkCalculatedState],
          updates: List[DataUpdate]
        )(implicit context: L0NodeContext[IO]): IO[DataState[LexLinkOnChainState, LexLinkCalculatedState]] = {
          // Group updates into a single block
          val block = DataApplicationBlock(
            updates = updates,
            source = oldState.onChain
          )

          Combiners.combineBlock[IO](oldState, block)
        }

        override def serializeState(
          state: DataState[LexLinkOnChainState, LexLinkCalculatedState]
        ): IO[Array[Byte]] = {
          Serializers.serializeState[IO](state).map(_.getBytes("UTF-8"))
        }

        override def deserializeState(
          bytes: Array[Byte]
        ): IO[Either[Throwable, DataState[LexLinkOnChainState, LexLinkCalculatedState]]] = {
          IO.delay {
            import io.circe.parser._
            import io.circe.generic.auto._

            val json = new String(bytes, "UTF-8")
            decode[DataState[LexLinkOnChainState, LexLinkCalculatedState]](json)
          }
        }

        override def serializeUpdate(
          update: DataUpdate
        ): IO[Array[Byte]] = {
          IO.delay(update.asJson.noSpaces.getBytes("UTF-8"))
        }

        override def deserializeUpdate(
          bytes: Array[Byte]
        ): IO[Either[Throwable, DataUpdate]] = {
          IO.delay {
            import io.circe.parser._
            val json = new String(bytes, "UTF-8")
            decode[DataUpdate](json)
          }
        }

        override def serializeBlock(
          block: DataApplicationBlock
        ): IO[Array[Byte]] = {
          IO.delay(block.asJson.noSpaces.getBytes("UTF-8"))
        }

        override def deserializeBlock(
          bytes: Array[Byte]
        ): IO[Either[Throwable, DataApplicationBlock]] = {
          IO.delay {
            import io.circe.parser._
            val json = new String(bytes, "UTF-8")
            decode[DataApplicationBlock](json)
          }
        }

        override def routes(implicit context: L0NodeContext[IO]): HttpRoutes[IO] = {
          CustomRoutes.make[IO]().routes(context.getLastState)
        }

        override def signedDataEntityEncoder: EntityEncoder[IO, Signed[DataUpdate]] = ???
      }
    ).some
}
