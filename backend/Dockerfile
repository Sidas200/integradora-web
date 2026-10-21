# ---------- Stage 1: build the jar ----------
  FROM eclipse-temurin:21-jdk AS build
  WORKDIR /workspace
  COPY . .
  # Windows checkouts may leave CRLF line endings in mvnw
  RUN sed -i 's/\r$//' mvnw && chmod +x mvnw
  # Tests and Checkstyle already run in ci-backend.yml; the Maven cache is reused between builds
  RUN --mount=type=cache,target=/root/.m2 ./mvnw -B -ntp package -DskipTests -Dcheckstyle.skip
  
  # ---------- Stage 2: run with a JRE only ----------
  FROM eclipse-temurin:21-jre
  LABEL org.opencontainers.image.title="tdimp-api" \
        org.opencontainers.image.description="The Day I Made That Promise REST API (Spring Boot)"
  RUN groupadd --system app && useradd --system --gid app --no-create-home app
  WORKDIR /app
  COPY --from=build /workspace/target/*.jar app.jar
  USER app
  EXPOSE 8080
  ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app/app.jar"]