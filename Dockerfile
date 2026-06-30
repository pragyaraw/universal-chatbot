FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY target/*.jar app.jar
USER appuser
EXPOSE 8080
ENTRYPOINT ["java", "-Xmx400m", "-Xms100m", "-XX:+UseSerialGC", "-XX:MaxMetaspaceSize=100m", "-jar", "app.jar"]