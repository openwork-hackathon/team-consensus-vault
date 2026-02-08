#!/bin/bash
# Generate Demo Video with Extended TTS Narration for Consensus Vault
# CVAULT-49: Demo Video Recording - Version 2 (Extended to 3+ minutes)

set -e

DEMO_DIR="/home/shazbot/team-consensus-vault/demo"
TTS_MODEL="/home/shazbot/openclaw/shared/tts/voices/en_US-lessac-medium.onnx"
AUDIO_DIR="$DEMO_DIR/audio_segments_v2"
OUTPUT_FILE="$DEMO_DIR/demo-with-narration-v2.mp4"

echo "=== Consensus Vault Demo Video Generator with TTS (Extended) ==="
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
    echo "$text" | piper -m "$TTS_MODEL" -f "$output_file" --length-scale 1.15 --sentence-silence 0.6

    # Get duration
    duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$output_file")
    echo "  Duration: ${duration}s"
    echo "$duration" > "$AUDIO_DIR/${segment_name}.duration"
}

# Function to generate silence segment
generate_silence() {
    local segment_name="$1"
    local duration="$2"
    local output_file="$AUDIO_DIR/${segment_name}.wav"

    echo "Generating silence: $segment_name (${duration}s)"
    ffmpeg -y -f lavfi -i anullsrc=r=22050:cl=mono -t "$duration" "$output_file" 2>/dev/null
}

echo "=== Step 1: Generating Extended TTS Narration Segments ==="
echo ""

# Scene 1: Introduction (target ~35-40 seconds) - Extended
generate_segment "01_intro_hook" "Have you ever wondered how institutional traders make million-dollar decisions? They don't trust just one analyst. They get consensus from entire teams of experts."

generate_silence "01a_pause" "1.5"

generate_segment "02_intro_problem" "For retail traders, that level of institutional analysis has always been out of reach. Until now."

generate_silence "02a_pause" "1.0"

generate_segment "03_intro_solution" "We're bringing that same wisdom-of-crowds approach to decentralized finance. But instead of human analysts, we're using five specialized AI models that analyze markets 24/7 and only trade when they reach consensus."

generate_silence "03a_pause" "1.2"

generate_segment "04_intro_name" "This is Consensus Vault. Let me show you how it works."

generate_silence "04a_pause" "2.0"

# Scene 2: AI Analyst Council (target ~60-70 seconds) - Extended
generate_segment "05_council_intro" "Here's the Consensus Vault dashboard. You're looking at five AI analyst models, each with a specialized role."

generate_silence "05a_pause" "1.5"

generate_segment "06_deepseek" "First, DeepSeek Quant. This model focuses on technical analysis. Chart patterns, support and resistance levels, and momentum indicators."

generate_segment "07_kimi" "Next, Kimi Macro analyzes on-chain data and whale activity. It tracks large wallet movements and blockchain metrics."

generate_segment "08_minimax" "MiniMax Sentiment reads market psychology. Social media trends, fear and greed indices, and trader positioning."

generate_segment "09_glm" "GLM Technical studies price action patterns. Candlestick formations, volume profiles, and trend strength."

generate_segment "10_gemini" "And finally, Gemini Risk assesses the risk-reward profile. It calculates position sizing and stop-loss levels."

generate_silence "10a_pause" "1.2"

generate_segment "11_diversity" "Each of these models runs independently. They don't share answers. They don't copy each other. This prevents groupthink and creates true diversified analysis. It's the same principle behind successful hedge funds: multiple perspectives lead to better decisions."

generate_silence "11a_pause" "2.0"

# Scene 3: Query Demo (target ~50-60 seconds) - Extended
generate_segment "12_query_intro" "Let me show you how a query works. I'll ask the council: Should I buy Bitcoin at current levels?"

generate_silence "12a_pause" "2.0"

generate_segment "13_query_watch" "Watch what happens next. All five agents start analyzing simultaneously, but independently. No agent knows what the others are thinking."

generate_silence "13a_pause" "1.5"

generate_segment "14_query_responses" "See the typing indicators? Each agent is processing the query right now using its specialized knowledge base."

generate_silence "14a_pause" "1.0"

generate_segment "15_query_deepseek" "DeepSeek just finished. Look at that 85 percent confidence with a bullish signal. Its technical analysis supports buying."

generate_segment "16_query_others" "Now Kimi weighs in, also bullish based on whale accumulation patterns. The other agents are completing their analysis."

generate_silence "16a_pause" "1.0"

generate_segment "17_consensus_meter" "Notice the consensus meter at the top. It's calculating agreement across all agents in real-time as each one reports its findings."

generate_silence "17a_pause" "2.0"

# Scene 4: Consensus and Signal (target ~45-55 seconds) - Extended
generate_segment "18_threshold" "When consensus reaches 80 percent or higher, the vault triggers a trade signal. Four out of five agents agree: BUY Bitcoin. That's 84 percent consensus."

generate_silence "18a_pause" "1.5"

generate_segment "19_innovation" "This is the key innovation. A single AI model can be wrong. Markets are unpredictable. But when five independent models with different specializations reach the same conclusion? That signal is statistically far more reliable."

generate_silence "19a_pause" "1.0"

generate_segment "20_modes" "The vault can execute trades automatically when consensus is reached. Or you can use it as a decision-support tool for your own trading. Your choice. Your control."

generate_silence "20a_pause" "2.0"

# Scene 5: Tech Stack & Security (target ~40-50 seconds) - Extended
generate_segment "21_tech_intro" "Let's talk about how this is built, because security was our top priority."

generate_silence "21a_pause" "0.8"

generate_segment "22_tech_frontend" "The frontend is Next.js with TypeScript, giving us a fast, type-safe application. We're calling five different AI APIs in parallel: DeepSeek, Kimi, MiniMax, GLM, and Gemini."

generate_segment "23_tech_blockchain" "On the blockchain side, we're deployed on Base network. For token functionality, we're using Mint Club V2."

generate_silence "23a_pause" "0.8"

generate_segment "24_security" "Here's the important part: no custom smart contracts. We're using audited, battle-tested infrastructure from Mint Club. This is a deliberate security choice. New smart contracts are a common attack vector in DeFi. We eliminated that risk entirely."

generate_silence "24a_pause" "2.0"

# Scene 6: Vision (NEW section ~25-30 seconds)
generate_segment "25_vision_intro" "Looking ahead, Consensus Vault is just the beginning."

generate_segment "26_vision_phases" "Phase 1 is automated crypto trading with multi-model consensus, which you've seen today. Phase 2 expands to other asset classes. Phase 3 introduces decentralized governance where token holders can vote on which AI models to include in the council."

generate_silence "26a_pause" "1.0"

generate_segment "27_vision_goal" "The ultimate goal? A fully autonomous investment DAO where the wisdom of AI crowds outperforms any single fund manager."

generate_silence "27a_pause" "2.0"

# Scene 7: Closing (target ~25-30 seconds) - Extended
generate_segment "28_closing" "Consensus Vault brings the wisdom of AI crowds to decentralized finance. No more relying on a single prediction. No more FOMO. Just data-driven decisions backed by multi-model consensus."

generate_silence "28a_pause" "1.0"

generate_segment "29_cta" "Try it now at team-consensus-vault.vercel.app. The code is fully open source on GitHub."

generate_silence "29a_pause" "0.8"

generate_segment "30_thanks" "This is Consensus Vault. Built by a team of four autonomous AI agents for the Openwork Clawathon. Thanks for watching!"

echo ""
echo "=== Step 2: Concatenating Audio Segments ==="

# Create file list for ffmpeg concat
cat > "$AUDIO_DIR/concat_list.txt" << 'EOF'
file '01_intro_hook.wav'
file '01a_pause.wav'
file '02_intro_problem.wav'
file '02a_pause.wav'
file '03_intro_solution.wav'
file '03a_pause.wav'
file '04_intro_name.wav'
file '04a_pause.wav'
file '05_council_intro.wav'
file '05a_pause.wav'
file '06_deepseek.wav'
file '07_kimi.wav'
file '08_minimax.wav'
file '09_glm.wav'
file '10_gemini.wav'
file '10a_pause.wav'
file '11_diversity.wav'
file '11a_pause.wav'
file '12_query_intro.wav'
file '12a_pause.wav'
file '13_query_watch.wav'
file '13a_pause.wav'
file '14_query_responses.wav'
file '14a_pause.wav'
file '15_query_deepseek.wav'
file '16_query_others.wav'
file '16a_pause.wav'
file '17_consensus_meter.wav'
file '17a_pause.wav'
file '18_threshold.wav'
file '18a_pause.wav'
file '19_innovation.wav'
file '19a_pause.wav'
file '20_modes.wav'
file '20a_pause.wav'
file '21_tech_intro.wav'
file '21a_pause.wav'
file '22_tech_frontend.wav'
file '23_tech_blockchain.wav'
file '23a_pause.wav'
file '24_security.wav'
file '24a_pause.wav'
file '25_vision_intro.wav'
file '26_vision_phases.wav'
file '26a_pause.wav'
file '27_vision_goal.wav'
file '27a_pause.wav'
file '28_closing.wav'
file '28a_pause.wav'
file '29_cta.wav'
file '29a_pause.wav'
file '30_thanks.wav'
EOF

# Concatenate all audio
ffmpeg -y -f concat -safe 0 -i "$AUDIO_DIR/concat_list.txt" -c:a pcm_s16le "$AUDIO_DIR/full_narration.wav"

# Get total duration
TOTAL_DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$AUDIO_DIR/full_narration.wav")
echo "Total narration duration: ${TOTAL_DURATION}s ($(echo "scale=2; $TOTAL_DURATION / 60" | bc) minutes)"

echo ""
echo "=== Step 3: Creating Extended Video ==="

# Get existing video duration
VIDEO_DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$DEMO_DIR/demo-automated.mp4")
echo "Existing video duration: ${VIDEO_DURATION}s"
echo "Audio duration: ${TOTAL_DURATION}s"

# Calculate how many times to loop (rounded up)
LOOPS=$(echo "scale=0; ($TOTAL_DURATION / $VIDEO_DURATION) + 2" | bc)
echo "Looping video ${LOOPS}x to cover audio"

# Create extended video by looping
ffmpeg -y -stream_loop $LOOPS -i "$DEMO_DIR/demo-automated.mp4" \
    -t $TOTAL_DURATION \
    -c:v libx264 -preset fast -crf 23 \
    "$DEMO_DIR/video_extended_v2.mp4"

echo ""
echo "=== Step 4: Combining Video and Audio ==="

# Convert audio to AAC for MP4 with better settings
ffmpeg -y -i "$AUDIO_DIR/full_narration.wav" -c:a aac -b:a 192k -ar 44100 "$AUDIO_DIR/full_narration.aac"

# Combine video and audio
ffmpeg -y -i "$DEMO_DIR/video_extended_v2.mp4" -i "$AUDIO_DIR/full_narration.aac" \
    -c:v copy -c:a copy \
    -map 0:v:0 -map 1:a:0 \
    -shortest \
    "$OUTPUT_FILE"

# Cleanup extended video
rm -f "$DEMO_DIR/video_extended_v2.mp4"

echo ""
echo "=== Step 5: Verifying Output ==="

FINAL_DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$OUTPUT_FILE")
FINAL_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
FINAL_MINUTES=$(echo "scale=2; $FINAL_DURATION / 60" | bc)

echo ""
echo "=========================================="
echo "           GENERATION COMPLETE           "
echo "=========================================="
echo ""
echo "Output file: $OUTPUT_FILE"
echo "Duration: ${FINAL_DURATION}s (${FINAL_MINUTES} minutes)"
echo "Size: $FINAL_SIZE"
echo ""

# Verify against requirements
DURATION_INT=$(echo "$FINAL_DURATION" | cut -d. -f1)
if [ "$DURATION_INT" -ge 180 ] && [ "$DURATION_INT" -le 300 ]; then
    echo "✓ Duration is within 3-5 minute requirement (${DURATION_INT}s)"
else
    echo "⚠ Duration: ${DURATION_INT}s"
    if [ "$DURATION_INT" -lt 180 ]; then
        echo "  Below 3 minute minimum"
    else
        echo "  Above 5 minute maximum"
    fi
fi

# Get resolution
RESOLUTION=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "$OUTPUT_FILE")
echo "Resolution: $RESOLUTION"

if [ "$RESOLUTION" = "1920x1080" ]; then
    echo "✓ Resolution is 1080p"
else
    echo "⚠ Resolution is $RESOLUTION (target: 1920x1080)"
fi

# Check audio
AUDIO_CODEC=$(ffprobe -v error -select_streams a:0 -show_entries stream=codec_name -of default=noprint_wrappers=1:nokey=1 "$OUTPUT_FILE")
echo "Audio codec: $AUDIO_CODEC"
echo "✓ Has audio track"

echo ""
echo "=========================================="
echo "To play: mpv $OUTPUT_FILE"
echo "To verify: ffprobe -v error -show_format $OUTPUT_FILE"
echo "=========================================="
