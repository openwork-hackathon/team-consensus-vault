#!/bin/bash
# Enhanced Demo Video Creator for Consensus Vault
# Creates a professional demo video with intro/outro and captions

set -e

OUTPUT_VIDEO="demo-final.mp4"
TEMP_DIR="demo-temp"
URL="https://team-consensus-vault.vercel.app"

echo "====================================="
echo "Enhanced Demo Video Creator"
echo "====================================="
echo ""

# Check dependencies
if ! command -v ffmpeg &> /dev/null; then
    echo "Error: ffmpeg is not installed"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "Error: node is not installed"
    exit 1
fi

# Clean up temp directory
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

echo "Step 1: Generating base video from website..."
node generate-demo-video.js

echo ""
echo "Step 2: Creating intro slide..."

# Create intro slide with ImageMagick or ffmpeg
ffmpeg -y -f lavfi -i "color=c=0x0d1117:s=1920x1080:d=3" \
    -vf "
    drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:
    text='Consensus Vault':fontsize=72:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2-50,
    drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:
    text='Decentralized Governance Platform':fontsize=36:fontcolor=58a6ff:x=(w-text_w)/2:y=(h-text_h)/2+40,
    drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:
    text='Openwork Hackathon 2026':fontsize=24:fontcolor=8b949e:x=(w-text_w)/2:y=(h-text_h)/2+100
    " \
    -c:v libx264 -pix_fmt yuv420p -r 30 "$TEMP_DIR/intro.mp4"

echo "Step 3: Creating feature highlights..."

# Create feature highlight slides
ffmpeg -y -f lavfi -i "color=c=0x0d1117:s=1920x1080:d=2" \
    -vf "
    drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:
    text='Key Features':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=100,
    drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:
    text='• Token-weighted voting system':fontsize=32:fontcolor=white:x=200:y=250,
    drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:
    text='• On-chain proposal creation':fontsize=32:fontcolor=white:x=200:y=310,
    drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:
    text='• Real-time vote tracking':fontsize=32:fontcolor=white:x=200:y=370,
    drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:
    text='• Mint Club V2 integration':fontsize=32:fontcolor=white:x=200:y=430
    " \
    -c:v libx264 -pix_fmt yuv420p -r 30 "$TEMP_DIR/features.mp4"

echo "Step 4: Creating outro slide..."

ffmpeg -y -f lavfi -i "color=c=0x0d1117:s=1920x1080:d=3" \
    -vf "
    drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:
    text='Thank You!':fontsize=72:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2-80,
    drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:
    text='team-consensus-vault.vercel.app':fontsize=32:fontcolor=58a6ff:x=(w-text_w)/2:y=(h-text_h)/2+20,
    drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:
    text='github.com/openwork-hackathon/team-consensus-vault':fontsize=24:fontcolor=8b949e:x=(w-text_w)/2:y=(h-text_h)/2+80
    " \
    -c:v libx264 -pix_fmt yuv420p -r 30 "$TEMP_DIR/outro.mp4"

echo "Step 5: Concatenating all segments..."

# Create concat file list
cat > "$TEMP_DIR/concat.txt" << EOF
file 'intro.mp4'
file 'features.mp4'
file '../demo-generated.mp4'
file 'outro.mp4'
EOF

# Concatenate videos
ffmpeg -y -f concat -safe 0 -i "$TEMP_DIR/concat.txt" \
    -c:v libx264 -pix_fmt yuv420p -preset slow -crf 22 \
    -movflags +faststart "$OUTPUT_VIDEO"

# Clean up
rm -rf "$TEMP_DIR"

# Get final stats
FILE_SIZE=$(du -h "$OUTPUT_VIDEO" | awk '{print $1}')
DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$OUTPUT_VIDEO" | cut -d. -f1)

echo ""
echo "====================================="
echo "Enhanced demo video created!"
echo "====================================="
echo "Output: $OUTPUT_VIDEO"
echo "Size: $FILE_SIZE"
echo "Duration: ${DURATION}s"
echo ""
echo "Next steps:"
echo "1. Review: mpv $OUTPUT_VIDEO"
echo "2. Upload to YouTube: https://studio.youtube.com/"
echo "3. Or upload to Loom: https://www.loom.com/"
echo "4. Save URL to: DEMO_VIDEO_URL.txt"
echo ""
