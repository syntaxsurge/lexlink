package com.lexlink.shared_data.serializers

import cats.effect.Sync
import com.lexlink.shared_data.types._
import io.circe.syntax._
import io.circe.{Decoder, Encoder}
import org.tessellation.currency.dataApplication.DataUpdate
import org.tessellation.currency.dataApplication.dataApplication.DataApplicationBlock
import org.tessellation.schema.SnapshotOrdinal

object Serializers {
  /**
   * Encoder for DataUpdate - handles all update types
   */
  implicit val dataUpdateEncoder: Encoder[DataUpdate] = Encoder.instance {
    case l: LicenseUpdate => l.asJson
    case d: DisputeUpdate => d.asJson
    case other => throw new IllegalArgumentException(s"Unknown DataUpdate type: ${other.getClass.getSimpleName}")
  }

  /**
   * Decoder for DataUpdate - attempts to decode as each type
   */
  implicit val dataUpdateDecoder: Decoder[DataUpdate] =
    List[Decoder[DataUpdate]](
      Decoder[LicenseUpdate].widen,
      Decoder[DisputeUpdate].widen
    ).reduceLeft(_ or _)

  /**
   * Serializes OnChainState and CalculatedState to JSON
   */
  def serializeState[F[_]: Sync](
    state: DataState[LexLinkOnChainState, LexLinkCalculatedState]
  ): F[String] = {
    Sync[F].delay {
      import io.circe.syntax._
      import io.circe.generic.auto._

      Map(
        "onChain" -> state.onChain.asJson,
        "calculated" -> state.calculated.asJson
      ).asJson.noSpaces
    }
  }

  /**
   * Serializes CalculatedState to JSON (for API responses)
   */
  def serializeCalculatedState[F[_]: Sync](
    state: LexLinkCalculatedState
  ): F[String] = {
    Sync[F].delay {
      state.asJson.noSpaces
    }
  }
}
