#!/usr/bin/env bash
# Pruebas de la API con curl. Uso: bash docs/testing/scripts/api-smoke.sh
# Variable opcional API (por defecto http://localhost:8080).
set -u
API="${API:-http://localhost:8080}"
OUT_DIR="$(cd "$(dirname "$0")/.." && pwd)/evidencias/backend"
mkdir -p "$OUT_DIR"
OUT="$OUT_DIR/api-smoke-$(date +%Y%m%d-%H%M%S).md"
STAMP="$(date +%s)"

{
  echo "# Pruebas de humo de la API ($(date -u +%Y-%m-%dT%H:%M:%SZ))"
  echo
  echo "API: \`$API\`"
  echo
  echo "| Caso | Petición | Esperado | Status | Tiempo total (s) | TTFB (s) | Bytes respuesta | Server-Timing | OK |"
  echo "|---|---|---|---|---|---|---|---|---|"
} > "$OUT"

run() { # id, descripción, esperado, método, ruta, [cuerpo]
  local id="$1" desc="$2" expected="$3" method="$4" path="$5" body="${6:-}"
  local headers; headers="$(mktemp)"
  local args=(-s -o /dev/null -D "$headers" -X "$method" -w '%{http_code} %{time_total} %{time_starttransfer} %{size_download}')
  [ -n "$body" ] && args+=(-H 'Content-Type: application/json' --data "$body")
  read -r status total ttfb size < <(curl "${args[@]}" "$API$path")
  local timing; timing="$(grep -i '^server-timing:' "$headers" | cut -d' ' -f2- | tr -d '\r')"
  local ok="✘"; [ "$status" = "$expected" ] && ok="✔"
  printf '%s %-58s -> %s (esperado %s) %ss\n' "$ok" "$id $desc" "$status" "$expected" "$total"
  echo "| $id | \`$method $path\` $desc | $expected | $status | $total | $ttfb | $size | ${timing:-—} | $ok |" >> "$OUT"
  rm -f "$headers"
}

run API-01 "listado, primera página"            200 GET  "/api/v1/news?page=0&size=5"
run API-02 "listado, segunda página"            200 GET  "/api/v1/news?page=1&size=5"
run API-03 "detalle de una noticia publicada"   200 GET  "/api/v1/news/lab-devlog-06-forge"
run API-04 "el borrador no es visible"          404 GET  "/api/v1/news/lab-draft-not-visible"
run API-05 "size fuera de rango (51)"           400 GET  "/api/v1/news?size=51"
run API-06 "registro válido"                    202 POST "/api/v1/subscriptions" "{\"email\":\"lab-smoke-$STAMP@tdimp.test\",\"language\":\"es\",\"consent\":true}"
run API-07 "mismo correo otra vez (no duplica)" 202 POST "/api/v1/subscriptions" "{\"email\":\"lab-smoke-$STAMP@tdimp.test\",\"language\":\"es\",\"consent\":true}"
run API-08 "correo inválido"                    400 POST "/api/v1/subscriptions" '{"email":"no-es-correo","language":"es","consent":true}'
run API-09 "sin consentimiento"                 400 POST "/api/v1/subscriptions" "{\"email\":\"lab-noconsent-$STAMP@tdimp.test\",\"language\":\"es\",\"consent\":false}"
run API-10 "idioma no soportado"                400 POST "/api/v1/subscriptions" "{\"email\":\"lab-fr-$STAMP@tdimp.test\",\"language\":\"fr\",\"consent\":true}"
run API-11 "JSON mal formado"                   400 POST "/api/v1/subscriptions" '{"email":'

if [ "$API" = "http://localhost:8080" ]; then
  {
    echo
    echo "## Métricas del backend (Actuator, perfil local)"
    for m in "health" "metrics/jvm.memory.used?tag=area:heap" "metrics/http.server.requests?tag=uri:/api/v1/news" \
             "metrics/http.server.requests?tag=uri:/api/v1/subscriptions" "metrics/hikaricp.connections.active"; do
      echo
      echo "\`GET /actuator/$m\`"
      echo
      echo '```json'
      curl -s "$API/actuator/$m"
      echo
      echo '```'
    done
  } >> "$OUT"
fi

echo
echo "Correo de la prueba API-06/07: lab-smoke-$STAMP@tdimp.test"
echo "Resultados en $OUT"
