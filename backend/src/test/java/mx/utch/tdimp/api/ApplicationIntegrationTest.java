package mx.utch.tdimp.api;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.ActiveProfiles;

/**
 * Starts the whole API against a real PostgreSQL (tdimp_test locally, PostgreSQL 16 in CI)
 * and checks that Flyway left the schema and the catalogs in place.
 */
@SpringBootTest
@ActiveProfiles("test")
class ApplicationIntegrationTest {

  @Autowired
  JdbcClient jdbc;

  @Test
  void flywayCreatesSchemaAndCatalogs() {
    long tables = jdbc.sql("""
            select count(*) from information_schema.tables
            where table_schema = 'game' and table_type = 'BASE TABLE' and table_name <> 'flyway_schema_history'
            """)
        .query(Long.class).single();
    long achievements = jdbc.sql("select count(*) from game.achievements").query(Long.class).single();

    assertThat(tables).isEqualTo(19);
    assertThat(achievements).isPositive();
  }
}