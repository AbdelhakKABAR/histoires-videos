#!/bin/bash
# Prépare l'environnement des jeux : paquets Python, drapeaux, polices.
set -e
cd "$(dirname "$0")"
pip install -q --break-system-packages pymunk pycairo cairosvg numpy "sherpa-onnx<2" soundfile scipy 2>/dev/null || true
[ -d node_modules/flag-icons ] || npm i --no-audit --no-fund --silent
mkdir -p ~/.local/share/fonts
find node_modules/@expo-google-fonts -name "*.ttf" -exec cp {} ~/.local/share/fonts/ \;
fc-cache -f >/dev/null
echo "prêt"
