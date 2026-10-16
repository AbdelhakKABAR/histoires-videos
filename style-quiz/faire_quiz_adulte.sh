#!/usr/bin/env bash
# Fabrique une vidéo quiz ADULTE (style pro) en une commande :
#   bash style-quiz/faire_quiz_adulte.sh style-quiz/adultes/<nom>.json
# -> style-quiz/_films/livraison/<nom>.mp4 (9:16, voix siwis, < 30 Mo)
# Le JSON contient tout : questions (q = texte lu, qd = texte affiché), subject, banner (titre fixe en haut), symbols (fond).
set -euo pipefail
D=$(cd "$(dirname "$0")" && pwd); EP=$(realpath "$1"); SLUG=$(basename "$EP" .json | sed 's/^episode-//' | tr -c 'a-z0-9\n-' '-')
SK=${MOTION_REEL:-}
if [ -z "$SK" ]; then SC=$(find / -path /proc -prune -o -path '*/.trash' -prune -o -name scaffold.mjs -path '*motion-reel/scripts/*' -print 2>/dev/null | head -1); SK=$(dirname "$(dirname "$SC")"); fi
echo "motion-reel : $SK"
F="$D/_films"; mkdir -p "$F/livraison" "$HOME/voix"
# police Montserrat
if [ ! -f "$F/montserrat.woff2" ]; then (cd /tmp && npm i -s @fontsource-variable/montserrat >/dev/null 2>&1) && cp /tmp/node_modules/@fontsource-variable/montserrat/files/montserrat-latin-wght-normal.woff2 "$F/montserrat.woff2"; fi
cp "$D/../moteur/rendu.mjs" "$F/rendu.mjs"
cd "$F"; rm -rf "$SLUG"; node "$SK/scripts/scaffold.mjs" "$SLUG" --duration 120 --formats 9x16 | tail -1
cp montserrat.woff2 "$SLUG/fonts/display.woff2"; cp montserrat.woff2 "$SLUG/fonts/ui.woff2"
cd "$D"; uv run quiz_voix_court.py "_films/$SLUG" "$EP" "$HOME/voix" 2>&1 | grep -E "durée|Error" || true
python3 - "$F/$SLUG/film.json" <<'PY'
import json,sys; p=sys.argv[1]; f=json.load(open(p)); f['poster']=1; json.dump(f,open(p,'w'),indent=1)
PY
python3 build_pro.py "_films/$SLUG/film.js"
uv run musique_pro.py "_films/$SLUG" >/dev/null 2>&1
cd "$F"; node "$SK/scripts/sfx.mjs" "$SLUG" | tail -1
node "$SK/scripts/mix.mjs" "$SLUG" --music-db -12 --sfx-db -4 --vo-db 3 --no-mux | tail -1
node rendu.mjs --film "$SLUG" --workers 10 --fps 30 > "rendu-$SLUG.log" 2>&1
ffmpeg -loglevel error -y -i "out/$SLUG/video_9x16.mp4" -i "$SLUG/audio/mix.wav" -map 0:v -map 1:a -c:v libx264 -preset veryfast -b:v 1800k -maxrate 2200k -bufsize 4400k -c:a aac -b:a 160k -shortest -movflags +faststart "livraison/$SLUG.mp4"
ls -la "livraison/$SLUG.mp4"
