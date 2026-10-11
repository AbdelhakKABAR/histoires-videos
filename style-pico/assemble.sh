#!/bin/sh
# Assemble les trois parties (image + son) en une vidéo d'une minute, avec un fondu de 0,4 s entre les parties.
#   ./assemble.sh <partie1> <partie2> <partie3> <sortie.mp4>      (à lancer depuis le dossier qui contient les parties et out/)
# Les décalages des fondus sont calculés à partir des durées de film.json.
set -e
A=$1; B=$2; C=$3; OUT=$4; F=0.4
d() { python3 -c "import json,sys;print(json.load(open(sys.argv[1]+'/film.json'))['duration'])" "$1"; }
O1=$(python3 -c "print($(d $A) - $F)"); O2=$(python3 -c "print($(d $A) + $(d $B) - 2 * $F)")
ffmpeg -hide_banner -loglevel error -y -i out/$A/video_9x16.mp4 -i out/$B/video_9x16.mp4 -i out/$C/video_9x16.mp4 -i $A/audio/mix.wav -i $B/audio/mix.wav -i $C/audio/mix.wav \
  -filter_complex "[0:v][1:v]xfade=transition=fade:duration=$F:offset=$O1[v01];[v01][2:v]xfade=transition=fade:duration=$F:offset=$O2[v];[3:a][4:a]acrossfade=d=$F[a01];[a01][5:a]acrossfade=d=$F[a]" \
  -map "[v]" -map "[a]" -c:v libx264 -preset fast -b:v 3300k -maxrate 4500k -bufsize 9000k -pix_fmt yuv420p -r 60 -c:a aac -b:a 160k -movflags +faststart "$OUT"
ffprobe -v error -show_entries format=duration,size -of csv=p=0 "$OUT"
