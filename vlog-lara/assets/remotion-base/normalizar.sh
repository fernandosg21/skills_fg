#!/bin/bash
# Normaliza cada cena: orientação correta, 1920x1080, 30 fps, AAC estéreo 48 kHz.
# Originais ficam intocados em originais/. Saída em projeto/public/clips/.
cd "$(dirname "$0")"
O=originais; P=projeto/public/clips
LN="loudnorm=I=-16:TP=-1.5:LRA=11"
V="scale=1920:1080:flags=lanczos,setsar=1,fps=30,format=yuv420p"

# enc <id> <arquivo> <inicio|-> <duracao|-> <filtro de video> <filtro de audio|-> [pre-input]
enc() {
  local id=$1 f=$2 ss=$3 t=$4 vf=$5 af=$6 pre=$7
  local a=(-v error -y $pre)
  [ "$ss" != "-" ] && a+=(-ss "$ss")
  a+=(-i "$O/$f")
  [ "$t" != "-" ] && a+=(-t "$t")
  a+=(-map 0:v:0 -map 0:a:0 -vf "$vf")
  [ "$af" != "-" ] && a+=(-af "$af")
  a+=(-c:v libx264 -preset fast -crf 18 -c:a aac -b:a 192k -ar 48000 -ac 2 "$P/$id.mp4")
  ffmpeg "${a[@]}" && echo "ok $id"
}

enc 01 IMG_8871.MOV - - "$V" "$LN"
enc 02 IMG_8872.MOV - - "$V" "$LN"
enc 04 85E566DD-01F0-4F52-B1B2-E3ED370A3F3F_90BA1A1F-D0B4-40C1-BAF7-94F27BFC5EDD_CB05517B-B0EA-44BD-972B-EC5DE62F9CCD_remux.MP4 - - "$V" "$LN"
enc 05 IMG_8881.MOV - - "$V" -
enc 06 IMG_8882.MOV - - "$V" "$LN"
enc 07 IMG_8892.MOV - - "$V" "$LN"
enc 08 IMG_8897.MOV - - "$V" "$LN"
enc 09 IMG_8900.MOV - - "$V" "$LN"
# 8902: gravado de cabeça para baixo na horizontal; ignorar a metadata e girar 180. 8903: horizontal correta sem metadata
enc 10 IMG_8902.MOV - - "hflip,vflip,$V" "$LN" "-noautorotate"
enc 11 IMG_8903.MOV - 10 "$V" - "-noautorotate"
enc 12 IMG_8905.MOV - - "$V" -
enc 13 IMG_8907.MOV - - "$V" -
enc 14 IMG_8908.MOV - - "$V" "$LN"
enc 15 IMG_8909.MOV 6 28 "$V" -
enc 16 IMG_8910.MOV 10 35 "$V" -
enc 17 IMG_8912.MOV - - "$V" -
enc 18 IMG_8915.MOV - - "$V" -
enc 19 IMG_8919.MOV - - "$V" -
enc 20 IMG_8921.MOV - - "$V" "$LN"
enc 21 IMG_8926.MOV - - "$V" "$LN"
