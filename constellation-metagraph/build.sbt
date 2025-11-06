import Dependencies._

ThisBuild / scalaVersion := "2.13.10"
ThisBuild / version := "1.0.0"
ThisBuild / organization := "com.lexlink"

lazy val shared_data = (project in file("modules/shared_data"))
  .enablePlugins(AshScriptPlugin, JavaAppPackaging, BuildInfoPlugin)
  .settings(
    name := "lexlink-shared_data",
    libraryDependencies ++= Seq(
      CompilerPlugin.kindProjector,
      CompilerPlugin.betterMonadicFor,
      CompilerPlugin.semanticDB,
      tessellationCore,
      tessellationShared,
      tessellationSdk
    ),
    testFrameworks += TestFramework("weaver.framework.CatsEffect"),
    Defaults.itSettings,
    dockerBaseImage := "ubuntu:20.04",
    dockerExposedPorts := Seq(9000, 9001),
    makeBatScripts := Seq()
  )

lazy val data_l1 = (project in file("modules/data_l1"))
  .enablePlugins(AshScriptPlugin, JavaAppPackaging)
  .dependsOn(shared_data)
  .settings(
    name := "lexlink-data_l1",
    libraryDependencies ++= Seq(
      CompilerPlugin.kindProjector,
      CompilerPlugin.betterMonadicFor,
      CompilerPlugin.semanticDB,
      tessellationCurrencyL1
    ),
    testFrameworks += TestFramework("weaver.framework.CatsEffect"),
    Defaults.itSettings,
    dockerBaseImage := "ubuntu:20.04",
    dockerExposedPorts := Seq(9400, 9401),
    makeBatScripts := Seq()
  )

lazy val l0 = (project in file("modules/l0"))
  .enablePlugins(AshScriptPlugin, JavaAppPackaging)
  .dependsOn(shared_data)
  .settings(
    name := "lexlink-l0",
    libraryDependencies ++= Seq(
      CompilerPlugin.kindProjector,
      CompilerPlugin.betterMonadicFor,
      CompilerPlugin.semanticDB,
      tessellationCurrencyL0
    ),
    testFrameworks += TestFramework("weaver.framework.CatsEffect"),
    Defaults.itSettings,
    dockerBaseImage := "ubuntu:20.04",
    dockerExposedPorts := Seq(9200, 9201),
    makeBatScripts := Seq()
  )
