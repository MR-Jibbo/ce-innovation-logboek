#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────
# Installatiescript voor CE-Innovation Logboek.
#
# Dubbelklik dit bestand om de app te installeren. Dit doet drie dingen:
#   1. Kopieert de app naar je Programma's-map (Applications).
#   2. Verwijdert macOS' "quarantaine"-vlag die anders een verwarrende
#      "app is beschadigd"-melding veroorzaakt (de app is NIET echt
#      beschadigd — dit is standaardgedrag van macOS bij apps zonder duur
#      Apple-ontwikkelaarscertificaat).
#   3. Opent de app meteen.
#
# Dit hoeft maar één keer per installatie — niet elke keer dat je de app
# opent.
# ─────────────────────────────────────────────────────────────────────────

set -e
cd "$(dirname "$0")"

APP_NAME="CE-Innovation Logboek.app"
DEST="/Applications/$APP_NAME"

echo ""
echo "CE-Innovation Logboek wordt geïnstalleerd..."
echo ""

if [ ! -d "$APP_NAME" ]; then
  echo "Kan '$APP_NAME' niet vinden naast dit installatiebestand."
  echo "Zorg dat je de hele zip volledig hebt uitgepakt (niet alleen dit"
  echo "bestand gekopieerd) en probeer het opnieuw."
  echo ""
  read -p "Druk op Enter om dit venster te sluiten..."
  exit 1
fi

echo "Stap 1/3 — Kopiëren naar Programma's..."
rm -rf "$DEST"
if ! ditto "$APP_NAME" "$DEST" 2>/tmp/logboek-install-error.log; then
  echo ""
  echo "Kopiëren naar /Applications is niet gelukt. Mogelijk heb je hiervoor"
  echo "geen toestemming op deze Mac. Probeer de app handmatig naar je"
  echo "Programma's-map te slepen en dit script opnieuw te draaien."
  cat /tmp/logboek-install-error.log 2>/dev/null || true
  echo ""
  read -p "Druk op Enter om dit venster te sluiten..."
  exit 1
fi

echo "Stap 2/3 — Beveiligingsvlag verwijderen zodat macOS de app vertrouwt..."
xattr -cr "$DEST" || true

echo "Stap 3/3 — App openen..."
echo ""
echo "Klaar! CE-Innovation Logboek is geïnstalleerd in je Programma's-map."
sleep 1
open "$DEST"

echo ""
read -p "Installatie voltooid — druk op Enter om dit venster te sluiten..."
