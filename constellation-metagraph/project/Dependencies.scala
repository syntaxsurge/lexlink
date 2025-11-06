import sbt._

object Dependencies {
  object V {
    val tessellation = "3.4.0-rc.13"
    val decline = "2.4.1"
    val circe = "0.14.5"
    val http4s = "0.23.23"
  }

  object CompilerPlugin {
    val betterMonadicFor = compilerPlugin(
      "com.olegpy" %% "better-monadic-for" % "0.3.1"
    )

    val kindProjector = compilerPlugin(
      ("org.typelevel" % "kind-projector" % "0.13.2").cross(CrossVersion.full)
    )

    val semanticDB = compilerPlugin(
      ("org.scalameta" % "semanticdb-scalac" % "4.8.9").cross(CrossVersion.full)
    )
  }

  object Tessellation {
    val namespace = "org.constellation"

    val core = namespace %% "tessellation-core" % V.tessellation
    val shared = namespace %% "tessellation-shared" % V.tessellation
    val sdk = namespace %% "tessellation-sdk-core" % V.tessellation
    val currencyL0 = namespace %% "tessellation-currency-l0" % V.tessellation
    val currencyL1 = namespace %% "tessellation-currency-l1" % V.tessellation
  }

  val tessellationCore = Tessellation.core
  val tessellationShared = Tessellation.shared
  val tessellationSdk = Tessellation.sdk
  val tessellationCurrencyL0 = Tessellation.currencyL0
  val tessellationCurrencyL1 = Tessellation.currencyL1

  val decline = "com.monovore" %% "decline" % V.decline
  val declineEffect = "com.monovore" %% "decline-effect" % V.decline

  val circeCore = "io.circe" %% "circe-core" % V.circe
  val circeGeneric = "io.circe" %% "circe-generic" % V.circe
  val circeParser = "io.circe" %% "circe-parser" % V.circe

  val http4sDsl = "org.http4s" %% "http4s-dsl" % V.http4s
  val http4sServer = "org.http4s" %% "http4s-ember-server" % V.http4s
  val http4sClient = "org.http4s" %% "http4s-ember-client" % V.http4s
  val http4sCirce = "org.http4s" %% "http4s-circe" % V.http4s
}
