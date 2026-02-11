#!/usr/bin/env python3
"""
CVAULT-239: Hackathon Demo Script
Demonstrates all working API endpoints for the hackathon demo
"""

import requests
import json
import time
import sys
from datetime import datetime

BASE_URL = "http://localhost:3000"
TIMEOUT = 60  # Increased for AI consensus

# Color codes
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
CYAN = "\033[96m"
RESET = "\033[0m"

def print_section(title):
    print(f"\n{CYAN}{'='*80}{RESET}")
    print(f"{CYAN}{title}{RESET}")
    print(f"{CYAN}{'='*80}{RESET}\n")

def print_success(message):
    print(f"{GREEN}✅ {message}{RESET}")

def print_info(message):
    print(f"{BLUE}ℹ️  {message}{RESET}")

def print_warning(message):
    print(f"{YELLOW}⚠️  {message}{RESET}")

def print_error(message):
    print(f"{RED}❌ {message}{RESET}")

def make_request(method, endpoint, data=None, params=None):
    """Make HTTP request and return response"""
    url = f"{BASE_URL}{endpoint}"
    try:
        if method == "GET":
            response = requests.get(url, params=params, timeout=TIMEOUT)
        elif method == "POST":
            response = requests.post(url, json=data, timeout=TIMEOUT)
        return response
    except Exception as e:
        print_error(f"Request failed: {e}")
        return None

def demo_health():
    """Demo: Health Check"""
    print_section("🏥 HEALTH CHECK")
    
    response = make_request("GET", "/api/health")
    if response and response.status_code == 200:
        data = response.json()
        print_success("System is operational")
        print_info(f"Status: {data.get('status', 'unknown')}")
        print_info(f"Uptime: {data.get('uptime', 0):.1f} seconds")
        print_info(f"Healthy Models: {data.get('system', {}).get('healthy_models', 0)}/{data.get('system', {}).get('total_models', 0)}")
        
        # Show model status
        models = data.get('models', [])
        for model in models:
            status_icon = "✅" if model.get('status') == 'healthy' else "❌"
            print(f"  {status_icon} {model.get('id', 'unknown')}: {model.get('status')} ({model.get('success_rate', 0):.0f}% success)")
        return True
    else:
        print_error("Health check failed")
        return False

def demo_market_data():
    """Demo: Market Data"""
    print_section("📊 MARKET DATA")
    
    # Get BTC Price
    response = make_request("GET", "/api/price")
    if response and response.status_code == 200:
        data = response.json()
        print_success(f"BTC Price: ${data.get('price', 0):,}")
        print_info(f"Asset: {data.get('asset', 'unknown')}")
        print_info(f"Cached: {data.get('cached', False)}")
    else:
        print_error("Failed to get BTC price")
        return False
    
    # Get comprehensive market data
    response = make_request("GET", "/api/market-data")
    if response and response.status_code == 200:
        data = response.json()
        print_success("Market data retrieved")
        if 'data' in data:
            btc_data = data['data']
            print_info(f"24h Change: {btc_data.get('price_change_24h', 0):.2f}%")
            print_info(f"24h High: ${btc_data.get('high_24h', 0):,}")
            print_info(f"24h Low: ${btc_data.get('low_24h', 0):,}")
            print_info(f"Market Cap: ${btc_data.get('market_cap', 0):,}")
        return True
    else:
        print_error("Failed to get market data")
        return False

def demo_consensus():
    """Demo: AI Consensus"""
    print_section("🤖 AI CONSENSUS ANALYSIS")
    
    print_info("Requesting AI consensus on Bitcoin price prediction...")
    print_info("This may take 10-15 seconds...")
    
    response = make_request("POST", "/api/consensus", 
                           data={"query": "Should Bitcoin reach $100k in 2026?"})
    
    if response and response.status_code == 200:
        data = response.json()
        print_success("Consensus analysis complete!")
        
        # Show consensus result
        consensus = data.get('consensus', '')
        if isinstance(consensus, str):
            print_info(f"Consensus: {consensus[:150]}...")
        else:
            print_info(f"Overall Signal: {consensus.get('signal', 'unknown').upper()}")
            print_info(f"Confidence: {consensus.get('confidence', 0)}%")
            print_info(f"Rationale: {consensus.get('rationale', 'N/A')[:100]}...")
        
        # Show individual model responses
        responses = data.get('individual_responses', [])
        print("\nIndividual Model Responses:")
        for model_response in responses:
            model_id = model_response.get('model', 'unknown')
            status = model_response.get('status', 'unknown')
            icon = "✅" if status == "success" else "❌"
            print(f"  {icon} {model_id}: {status}")
        
        # Show metadata
        metadata = data.get('metadata', {})
        print(f"\nMetadata:")
        print_info(f"Models Succeeded: {metadata.get('models_succeeded', 0)}")
        print_info(f"Cache Hit Rate: {metadata.get('cache_hit_rate', 0):.0%}")
        
        return True
    else:
        print_error("Consensus analysis failed")
        if response:
            print_error(f"Status: {response.status_code}")
        return False

def demo_chatroom():
    """Demo: Chatroom"""
    print_section("💬 CHATROOM")
    
    # Get chatroom history
    response = make_request("GET", "/api/chatroom/history")
    if response and response.status_code == 200:
        data = response.json()
        print_success("Chatroom history retrieved")
        print_info(f"Current Phase: {data.get('phase', 'unknown')}")
        print_info(f"Message Count: {data.get('messageCount', 0)}")
        
        messages = data.get('messages', [])
        if messages:
            print(f"\nRecent Messages:")
            for msg in messages[-3:]:  # Show last 3 messages
                handle = msg.get('handle', 'Unknown')
                content = msg.get('content', '')[:50]
                print(f"  @{handle}: {content}...")
        else:
            print_info("No messages yet - be the first to post!")
    else:
        print_error("Failed to get chatroom history")
        return False
    
    # Post a test message
    print("\nPosting test message...")
    response = make_request("POST", "/api/chatroom/post",
                           data={"userId": "demo-user-123", "handle": "DemoBot", "content": "Hello from the hackathon demo! 🤖"})
    
    if response and response.status_code == 200:
        print_success("Message posted successfully!")
    else:
        print_warning("Could not post message (may be rate limited)")
    
    return True

def demo_prediction_market():
    """Demo: Prediction Market"""
    print_section("🎰 PREDICTION MARKET")
    
    # Get current pool state
    response = make_request("GET", "/api/prediction-market/bet")
    if response and response.status_code == 200:
        data = response.json()
        print_success("Prediction market state retrieved")
        
        round_info = data.get('round') or {}
        pool = data.get('pool', {})
        odds = data.get('odds', {})
        
        print_info(f"Current Phase: {round_info.get('phase', 'not started')}")
        print_info(f"Asset: {round_info.get('asset', 'BTC')}")
        print_info(f"Can Bet: {data.get('canBet', False)}")
        
        total_up = pool.get('totalUp', 0)
        total_down = pool.get('totalDown', 0)
        total_pool = total_up + total_down
        
        print(f"\nPool Status:")
        print(f"  📈 UP Pool: ${total_up:,.2f}")
        print(f"  📉 DOWN Pool: ${total_down:,.2f}")
        print(f"  💰 Total Pool: ${total_pool:,.2f}")
        print(f"  🎲 Total Bets: {pool.get('totalBets', 0)}")
        
        print(f"\nCurrent Odds:")
        print(f"  📈 UP: {odds.get('up', 0):.2f}x")
        print(f"  📉 DOWN: {odds.get('down', 0):.2f}x")
        
        # Try to place a demo bet if betting is open
        if data.get('canBet', False):
            print("\nPlacing demo bet...")
            response = make_request("POST", "/api/prediction-market/bet",
                                   data={
                                       "address": "0x1234567890123456789012345678901234567890",
                                       "amount": 100,
                                       "side": "up"
                                   })
            if response and response.status_code == 200:
                bet_data = response.json()
                print_success("Demo bet placed successfully!")
                print_info(f"Bet ID: {bet_data.get('bet', {}).get('id', 'unknown')}")
                print_info(f"Potential Payout: ${bet_data.get('potentialPayout', {}).get('net', 0):.2f}")
            else:
                print_warning("Could not place bet (betting window may be closed)")
        else:
            print_info("Betting window is currently closed")
        
        return True
    else:
        print_error("Failed to get prediction market state")
        return False

def demo_trading():
    """Demo: Paper Trading"""
    print_section("💰 PAPER TRADING")
    
    # Get trading history
    response = make_request("GET", "/api/trading/history")
    if response and response.status_code == 200:
        data = response.json()
        print_success("Trading history retrieved")
        
        metrics = data.get('metrics', {})
        open_trades = data.get('openTrades', [])
        closed_trades = data.get('closedTrades', [])
        
        print_info(f"Total Trades: {metrics.get('totalTrades', 0)}")
        print_info(f"Win Rate: {metrics.get('winRate', 0):.1f}%")
        print_info(f"Total PnL: ${metrics.get('totalPnL', 0):.2f}")
        print_info(f"Open Trades: {len(open_trades)}")
        print_info(f"Closed Trades: {len(closed_trades)}")
        
        if open_trades:
            print(f"\nOpen Positions:")
            for trade in open_trades:
                print(f"  {trade.get('asset', 'unknown')}: {trade.get('position', 'unknown').upper()} @ ${trade.get('entryPrice', 0):,}")
        
        return True
    else:
        print_error("Failed to get trading history")
        return False

def demo_sse_streams():
    """Demo: SSE Streams"""
    print_section("📡 SSE STREAMS")
    
    print_info("Testing SSE stream endpoints...")
    print_info("These endpoints establish real-time connections for live updates")
    
    streams = [
        ("/api/consensus?asset=BTC", "Consensus Stream"),
        ("/api/chatroom/stream", "Chatroom Stream"),
        ("/api/prediction-market/stream", "Prediction Market Stream"),
        ("/api/human-chat/stream", "Human Chat Stream")
    ]
    
    for endpoint, name in streams:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", stream=True, timeout=5)
            if response.status_code == 200:
                print_success(f"{name}: Connected ✓")
            else:
                print_error(f"{name}: Failed ({response.status_code})")
        except Exception as e:
            print_error(f"{name}: Error - {str(e)[:50]}")

def run_demo():
    """Run complete demo"""
    print(f"\n{CYAN}{'='*80}{RESET}")
    print(f"{CYAN}🚀 CONSENSUS VAULT - HACKATHON DEMO{RESET}")
    print(f"{CYAN}Time: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}{RESET}")
    print(f"{CYAN}{'='*80}{RESET}")
    
    results = []
    
    # Run all demos
    results.append(("Health Check", demo_health()))
    results.append(("Market Data", demo_market_data()))
    results.append(("AI Consensus", demo_consensus()))
    results.append(("Chatroom", demo_chatroom()))
    results.append(("Prediction Market", demo_prediction_market()))
    results.append(("Paper Trading", demo_trading()))
    demo_sse_streams()  # Just test, don't count in results
    
    # Summary
    print_section("📊 DEMO SUMMARY")
    
    total = len(results)
    passed = sum(1 for _, result in results if result)
    
    print(f"Features Demonstrated: {passed}/{total}")
    print()
    
    for name, result in results:
        status = f"{GREEN}✅ WORKING{RESET}" if result else f"{RED}❌ FAILED{RESET}"
        print(f"  {name}: {status}")
    
    print(f"\n{CYAN}{'='*80}{RESET}")
    
    if passed == total:
        print(f"{GREEN}🎉 ALL SYSTEMS OPERATIONAL - DEMO READY!{RESET}")
    elif passed >= total * 0.8:
        print(f"{YELLOW}⚠️  MOST SYSTEMS OPERATIONAL - DEMO CAN PROCEED{RESET}")
    else:
        print(f"{RED}❌ SOME SYSTEMS NEED ATTENTION{RESET}")
    
    print(f"{CYAN}{'='*80}{RESET}\n")
    
    return 0 if passed == total else 1

if __name__ == "__main__":
    try:
        sys.exit(run_demo())
    except KeyboardInterrupt:
        print("\n\nDemo interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n{RED}Demo failed with error: {e}{RESET}")
        sys.exit(1)
