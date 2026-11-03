#!/bin/bash
# Met une vidéo en ligne pour Publio (lien public, 25 Mo max) :  bash style-quiz/envoyer_publio.sh <video.mp4>
# Compresse si > 23 Mo, copie dans partage/ du dépôt histoires-videos, commit + push, supprime les vidéos de plus de 2 jours,
# et affiche le lien public (dernière ligne) à donner à l'outil Publio « ajouter_video ».
set -e
cd "$(dirname "$0")/.."
V="$1"; N=$(basename "$V"); mkdir -p partage
if [ "$(stat -c %s "$V")" -gt 23000000 ]; then
  D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$V")
  BR=$(python3 -c "print(int(21e6*8/$D/1000)-130)")
  ffmpeg -v error -y -i "$V" -c:v libx264 -b:v ${BR}k -maxrate ${BR}k -bufsize $((BR*2))k -preset medium -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart "partage/$N"
else cp "$V" "partage/$N"; fi
find partage -name '*.mp4' -mtime +2 -exec git rm -q --cached {} \; -delete 2>/dev/null || true
git add partage
git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit -qm "Partage Publio : $N" || true
for i in 1 2 3; do git fetch -q origin main && git rebase -q origin/main && git push -q origin HEAD:main && break; sleep 5; done
U="https://raw.githubusercontent.com/AbdelhakKABAR/histoires-videos/main/partage/$N"
for i in $(seq 1 12); do curl -sfIL "$U" -o /dev/null && break; sleep 5; done
ls -la "partage/$N"; echo "$U"
