#!/bin/bash
# Demo Video Editing Script for Consensus Vault
# Usage: ./edit-demo-video.sh input-video.mp4

set -e

INPUT_VIDEO="$1"
OUTPUT_VIDEO="demo-edited.mp4"
TEMP_TRIMMED="demo-temp-trimmed.mp4"

if [ -z "$INPUT_VIDEO" ]; then
    echo "Error: No input video specified"
    echo "Usage: $0 input-video.mp4"
    exit 1
fi

if [ ! -f "$INPUT_VIDEO" ]; then
    echo "Error: Input video '$INPUT_VIDEO' not found"
    exit 1
fi

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "Error: ffmpeg is not installed"
    echo "Install with: sudo apt-get install ffmpeg"
    exit 1
fi

echo "Processing video: $INPUT_VIDEO"
echo ""

# Get video duration
DURATION=$(ffmpeg -i "$INPUT_VIDEO" 2>&1 | grep Duration | awk '{print $2}' | tr -d ,)
echo "Original duration: $DURATION"

# Step 1: Detect and trim silence from start and end
echo ""
echo "Step 1: Analyzing audio for silence detection..."
ffmpeg -i "$INPUT_VIDEO" -af silencedetect=noise=-30dB:d=1 -f null - 2>&1 | grep silence > silence_detect.txt || true

# Read silence data
START_TRIM="0"
if [ -s silence_detect.txt ]; then
    # Get end of first silence (trim from here)
    FIRST_SILENCE_END=$(grep "silence_end" silence_detect.txt | head -1 | awk '{print $5}' || echo "0")
    if [ -n "$FIRST_SILENCE_END" ] && [ "$FIRST_SILENCE_END" != "0" ]; then
        START_TRIM="$FIRST_SILENCE_END"
        echo "Detected silence at start, will trim from: ${START_TRIM}s"
    fi
fi

# Step 2: Trim video
echo ""
echo "Step 2: Trimming video..."
if [ "$START_TRIM" != "0" ]; then
    ffmpeg -i "$INPUT_VIDEO" -ss "$START_TRIM" -c copy "$TEMP_TRIMMED" -y
else
    cp "$INPUT_VIDEO" "$TEMP_TRIMMED"
fi

# Step 3: Re-encode for optimal web playback
echo ""
echo "Step 3: Re-encoding for web optimization..."
ffmpeg -i "$TEMP_TRIMMED" \
    -c:v libx264 \
    -preset slow \
    -crf 22 \
    -profile:v high \
    -level 4.0 \
    -pix_fmt yuv420p \
    -c:a aac \
    -b:a 128k \
    -ar 44100 \
    -movflags +faststart \
    "$OUTPUT_VIDEO" -y

# Clean up
rm -f "$TEMP_TRIMMED" silence_detect.txt

# Get final file size
FILE_SIZE=$(du -h "$OUTPUT_VIDEO" | awk '{print $1}')
FINAL_DURATION=$(ffmpeg -i "$OUTPUT_VIDEO" 2>&1 | grep Duration | awk '{print $2}' | tr -d ,)

echo ""
echo "====================================="
echo "Video editing complete!"
echo "====================================="
echo "Output file: $OUTPUT_VIDEO"
echo "File size: $FILE_SIZE"
echo "Duration: $FINAL_DURATION"
echo ""
echo "Next steps:"
echo "1. Review the video: mpv $OUTPUT_VIDEO"
echo "2. Upload to YouTube or Loom"
echo "3. Document the URL in DEMO_VIDEO_URL.txt"
echo ""
