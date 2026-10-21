package mx.utch.tdimp.api;

import static com.tngtech.archunit.base.DescribedPredicate.not;
import static com.tngtech.archunit.core.domain.JavaClass.Predicates.ENUMS;
import static com.tngtech.archunit.core.domain.JavaClass.Predicates.resideInAPackage;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.library.Architectures.layeredArchitecture;
import static com.tngtech.archunit.library.GeneralCodingRules.NO_CLASSES_SHOULD_USE_FIELD_INJECTION;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

/**
 * N-layer rules (README §4.3 and §5). If someone breaks them, the build fails.
 */
@AnalyzeClasses(packages = "mx.utch.tdimp.api", importOptions = ImportOption.DoNotIncludeTests.class)
class ArchitectureTest {

  /** Each layer only calls the one below it. */
  @ArchTest
  static final ArchRule layers = layeredArchitecture().consideringOnlyDependenciesInLayers()
      .layer("Controller").definedBy("..controller..")
      .layer("Service").definedBy("..service..")
      .layer("Repository").definedBy("..repository..")
      .whereLayer("Controller").mayNotBeAccessedByAnyLayer()
      .whereLayer("Service").mayOnlyBeAccessedByLayers("Controller")
      .whereLayer("Repository").mayOnlyBeAccessedByLayers("Service");

  /** The API only returns DTOs: controllers never touch entities (model enums are allowed). */
  @ArchTest
  static final ArchRule controllersNeverSeeEntities = noClasses().that().resideInAPackage("..controller..")
      .should().dependOnClassesThat(resideInAPackage("..model..").and(not(ENUMS)));

  /** Repositories speak in model terms, never in API terms. */
  @ArchTest
  static final ArchRule repositoriesDoNotKnowDtos = noClasses().that().resideInAPackage("..repository..")
      .should().dependOnClassesThat().resideInAPackage("..dto..");

  /** The domain does not depend on any layer. */
  @ArchTest
  static final ArchRule modelIsIndependent = noClasses().that().resideInAPackage("..model..")
      .should().dependOnClassesThat().resideInAnyPackage("..controller..", "..service..", "..repository..", "..dto..");

  /** Consumers depend on the interface; implementations stay package-private. */
  @ArchTest
  static final ArchRule implementationsAreHidden = classes()
      .that().haveSimpleNameEndingWith("Impl").or().haveSimpleNameEndingWith("Jdbc")
      .should().notBePublic();

  /** Dependencies always by constructor. */
  @ArchTest
  static final ArchRule constructorInjection = NO_CLASSES_SHOULD_USE_FIELD_INJECTION;
}