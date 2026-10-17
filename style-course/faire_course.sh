#!/bin/bash
# Course de billes « Quel drapeau va gagner ? » — usage : bash faire_course.sh <graine> <sortie.mp4>
# Dépendances : pip install pymunk pycairo numpy ; ffmpeg
set -e
cd "$(dirname "$0")"
SEED=${1:-39}; OUT=${2:-course.mp4}
python3 render.py "$SEED"
python3 audio.py
ffmpeg -loglevel error -y -i video_muet.mp4 -i son.wav -af "loudnorm=I=-14:TP=-1.5:LRA=11" \
  -c:v copy -c:a aac -b:a 192k -ar 44100 -shortest -movflags +faststart "$OUT"
rm -f video_muet.mp4 son.wav
echo "Vidéo : $OUT"
