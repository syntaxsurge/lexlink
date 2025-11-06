package com.lexlink.data_l1

import cats.effect.{IO, Resource}
import cats.syntax.all._
import com.lexlink.shared_data.combiners.Combiners
import com.lexlink.shared_data.serializers.Serializers._
import com.lexlink.shared_data.types._
import com.lexlink.shared_data.validations.Validations
import com.monovore.decline.Opts
import com.monovore.decline.effect.CommandIOApp
import org.tessellation.BuildInfo
import org.tessellation.currency.dataApplication._
import org.tessellation.currency.dataApplication.dataApplication._
import org.tessellation.currency.l1.CurrencyL1App
import org.tessellation.schema.cluster.ClusterId
import org.tessellation.schema.semver.{MetagraphVersion, TessellationVersion}

/**
 * LexLink Metagraph Data L1 Node
 *
 * This is the entry point for the Data L1 layer, which:
 * - Receives and validates incoming data submissions
 * - Participates in DAG consensus with other validators
 * - Propagates validated blocks to the L0 layer
 */
object Main extends CurrencyL1App(
  "lexlink-data_l1",
  "LexLink Metagraph Data L1 node",
  ClusterId("lexlink-metagraph-data-l1"),
  version = MetagraphVersion.unsafeFrom(org.tessellation.BuildInfo.version)
) {
  override def dataApplication: Option[Resource[IO, BaseDataApplicationL1Service[IO]]] =
    makeBaseDataApplicationL1Service(
      new DataApplicationL1Service[IO, LexLinkOnChainState, LexLinkCalculatedState] {
        override def validateUpdate(
          update: DataUpdate
        )(implicit context: L1NodeContext[IO]): IO[DataApplicationValidationErrorOr[Unit]] = {
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
        )(implicit context: L1NodeContext[IO]): IO[DataApplicationValidationErrorOr[Unit]] = {
          updates.traverse { update =>
            validateUpdate(update)
          }.map(_.sequence.void)
        }

        override def combine(
          oldState: DataState[LexLinkOnChainState, LexLinkCalculatedState],
          updates: List[DataUpdate]
        )(implicit context: L1NodeContext[IO]): IO[DataState[LexLinkOnChainState, LexLinkCalculatedState]] = {
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

        override def signedDataEntityEncoder: EntityEncoder[IO, Signed[DataUpdate]] = ???
      }
    ).some
}
