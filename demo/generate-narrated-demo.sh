#!/bin/bash
# Generate Demo Video with TTS Narration for Consensus Vault
# CVAULT-49: Demo Video Recording

set -e

DEMO_DIR="/home/shazbot/team-consensus-vault/demo"
TTS_MODEL="/home/shazbot/openclaw/shared/tts/voices/en_US-lessac-medium.onnx"
AUDIO_DIR="$DEMO_DIR/audio_segments"
OUTPUT_FILE="$DEMO_DIR/demo-with-narration.mp4"

echo "=== Consensus Vault Demo Video Generator with TTS ==="
echo "Date: $(date)"
echo ""

# Create audio directory
mkdir -p "$AUDIO_DIR"

# Function to generate TTS audio with timing info
generate_segment() {
    local segment_name="$1"
    local text="$2"
    local output_file="$AUDIO_DIR/${segment_name}.wav"

    echo "Generating: $segment_name"
    echo "$text" | piper -m "$TTS_MODEL" -f "$output_file" --length-scale 1.1 --sentence-silence 0.5

    # Get duration
    duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$output_file")
    echo "  Duration: ${duration}s"
    echo "$duration" > "$AUDIO_DIR/${segment_name}.duration"
}

echo "=== Step 1: Generating TTS Narration Segments ==="
echo ""

# Scene 1: Introduction (target ~25-30 seconds)
generate_segment "01_intro" "Have you ever wondered how institutional traders make million-dollar decisions? They don't trust just one analyst. They get consensus from entire teams of experts. We're bringing that same wisdom-of-crowds approach to decentralized finance. But instead of human analysts, we're using five specialized AI models that analyze markets 24/7 and only trade when they reach consensus. This is Consensus Vault."

# Scene 2: AI Analyst Council (target ~50-60 seconds)
generate_segment "02_council_intro" "Here's the Consensus Vault dashboard. You're looking at five AI analyst models, each with a specialized role."

generate_segment "03_council_agents" "DeepSeek Quant focuses on technical analysis. Kimi Macro analyzes on-chain data and whale activity. MiniMax Sentiment reads market psychology. GLM Technical studies price action patterns. And Gemini Risk assesses the risk-reward profile."

generate_segment "04_council_diversity" "Each of these models runs independently. They don't share answers. They don't copy each other. This prevents groupthink and creates true diversified analysis."

# Scene 3: Query Demo (target ~45-55 seconds)
generate_segment "05_query_intro" "Let me show you how it works. I'll ask the council: Should I buy Bitcoin at current levels?"

generate_segment "06_query_watch" "Watch what happens next. All five agents start analyzing simultaneously, but independently."

generate_segment "07_query_responses" "See the typing indicators? Each agent is processing the query right now. DeepSeek just finished. Look at that 85 percent confidence, bullish signal. Now Kimi weighs in, also bullish. Notice the consensus meter at the top. It's calculating agreement across all agents in real-time."

# Scene 4: Consensus and Signal (target ~40-50 seconds)
generate_segment "08_consensus" "When consensus reaches 80 percent or higher, the vault triggers a trade signal. Four out of five agents agree: BUY Bitcoin. That's 84 percent consensus."

generate_segment "09_innovation" "This is the key innovation. A single AI model can be wrong. But when five independent models with different specializations reach the same conclusion? That signal is far more reliable."

generate_segment "10_modes" "The vault can execute trades automatically when consensus is reached, or you can use it as a decision-support tool for your own trading."

# Scene 5: Tech Stack (target ~30-40 seconds)
generate_segment "11_tech" "Let's talk about how this is built. The frontend is Next.js with TypeScript. We're calling five different AI APIs in parallel: DeepSeek, Kimi, MiniMax, GLM, and Gemini."

generate_segment "12_security" "On the blockchain side, we're deployed on Base network using Mint Club V2 for our token. No custom smart contracts. We're using audited, battle-tested infrastructure. This is a deliberate security choice."

# Scene 6: Closing (target ~20-25 seconds)
generate_segment "13_closing" "Consensus Vault brings the wisdom of AI crowds to decentralized finance. No more relying on a single prediction. No more FOMO. Just data-driven decisions backed by multi-model consensus."

generate_segment "14_cta" "Try it now at team-consensus-vault.vercel.app. The code is open source on GitHub. Thanks for watching!"

echo ""
echo "=== Step 2: Concatenating Audio Segments ==="

# Create file list for ffmpeg concat
rm -f "$AUDIO_DIR/concat_list.txt"
for i in 01 02 03 04 05 06 07 08 09 10 11 12 13 14; do
    # Add a short silence between segments for pacing
    echo "file '${i}_*.wav'" >> "$AUDIO_DIR/concat_list_raw.txt"
done

# Proper concat list
cat > "$AUDIO_DIR/concat_list.txt" << 'EOF'
file '01_intro.wav'
file '02_council_intro.wav'
file '03_council_agents.wav'
file '04_council_diversity.wav'
file '05_query_intro.wav'
file '06_query_watch.wav'
file '07_query_responses.wav'
file '08_consensus.wav'
file '09_innovation.wav'
file '10_modes.wav'
file '11_tech.wav'
file '12_security.wav'
file '13_closing.wav'
file '14_cta.wav'
EOF

# Concatenate all audio
ffmpeg -y -f concat -safe 0 -i "$AUDIO_DIR/concat_list.txt" -c:a pcm_s16le "$AUDIO_DIR/full_narration.wav"

# Get total duration
TOTAL_DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$AUDIO_DIR/full_narration.wav")
echo "Total narration duration: ${TOTAL_DURATION}s"

echo ""
echo "=== Step 3: Creating Video ==="

# Get existing video duration
VIDEO_DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$DEMO_DIR/demo-automated.mp4")
echo "Existing video duration: ${VIDEO_DURATION}s"
echo "Audio duration: ${TOTAL_DURATION}s"

# If audio is longer than video, we need to loop/extend the video
if (( $(echo "$TOTAL_DURATION > $VIDEO_DURATION" | bc -l) )); then
    echo "Audio is longer than video - extending video with loop"

    # Calculate how many times to loop (rounded up)
    LOOPS=$(echo "($TOTAL_DURATION / $VIDEO_DURATION) + 1" | bc)

    # Create extended video by looping
    ffmpeg -y -stream_loop $LOOPS -i "$DEMO_DIR/demo-automated.mp4" \
        -t $TOTAL_DURATION \
        -c:v libx264 -preset fast -crf 23 \
        "$DEMO_DIR/video_extended.mp4"

    VIDEO_SOURCE="$DEMO_DIR/video_extended.mp4"
else
    VIDEO_SOURCE="$DEMO_DIR/demo-automated.mp4"
fi

echo ""
echo "=== Step 4: Combining Video and Audio ==="

# Convert audio to AAC for MP4
ffmpeg -y -i "$AUDIO_DIR/full_narration.wav" -c:a aac -b:a 192k "$AUDIO_DIR/full_narration.aac"

# Combine video and audio
ffmpeg -y -i "$VIDEO_SOURCE" -i "$AUDIO_DIR/full_narration.aac" \
    -c:v copy -c:a copy \
    -map 0:v:0 -map 1:a:0 \
    -shortest \
    "$OUTPUT_FILE"

# Cleanup extended video if created
if [ -f "$DEMO_DIR/video_extended.mp4" ]; then
    rm "$DEMO_DIR/video_extended.mp4"
fi

echo ""
echo "=== Step 5: Verifying Output ==="

FINAL_DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$OUTPUT_FILE")
FINAL_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)

echo ""
echo "=== COMPLETE ==="
echo "Output file: $OUTPUT_FILE"
echo "Duration: ${FINAL_DURATION}s ($(echo "scale=2; $FINAL_DURATION / 60" | bc) minutes)"
echo "Size: $FINAL_SIZE"
echo ""

# Verify against requirements
DURATION_INT=$(echo "$FINAL_DURATION" | cut -d. -f1)
if [ "$DURATION_INT" -ge 180 ] && [ "$DURATION_INT" -le 300 ]; then
    echo "✓ Duration is within 3-5 minute requirement"
else
    echo "⚠ Duration outside 3-5 minute target (actual: ${DURATION_INT}s)"
fi

# Get resolution
RESOLUTION=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "$OUTPUT_FILE")
echo "Resolution: $RESOLUTION"

if [ "$RESOLUTION" = "1920x1080" ]; then
    echo "✓ Resolution is 1080p"
else
    echo "⚠ Resolution is $RESOLUTION (target: 1920x1080)"
fi

echo ""
echo "To play: mpv $OUTPUT_FILE"
echo "To verify: ffprobe -v error -show_format $OUTPUT_FILE"
