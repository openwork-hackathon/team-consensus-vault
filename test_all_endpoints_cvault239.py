#!/usr/bin/env python3
"""
CVAULT-239: Comprehensive API Endpoint Test
Tests all API endpoints and documents working vs failing endpoints
"""

import requests
import json
import time
import sys
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
SSE_TIMEOUT = 10  # Shorter timeout for SSE endpoints

# Color codes for terminal output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"

class EndpointTester:
    def __init__(self):
        self.results = []
        self.session = requests.Session()
        
    def test_endpoint(self, name, method, endpoint, data=None, params=None, expect_error=False, is_sse=False):
        """Test an endpoint and return result"""
        url = f"{BASE_URL}{endpoint}"
        start = time.time()
        
        try:
            timeout = SSE_TIMEOUT if is_sse else TIMEOUT
            
            if method == "GET":
                response = self.session.get(url, params=params, timeout=timeout, stream=is_sse)
            elif method == "POST":
                response = self.session.post(url, json=data, timeout=timeout)
            elif method == "HEAD":
                response = self.session.head(url, timeout=timeout)
            
            elapsed = (time.time() - start) * 1000
            
            # For SSE endpoints, we just check if connection is established
            if is_sse:
                success = response.status_code == 200
                status_icon = f"{GREEN}✅{RESET}" if success else f"{RED}❌{RESET}"
                print(f"{status_icon} {name:45} {response.status_code}  {elapsed:6.0f}ms  (SSE)")
                return {
                    "name": name,
                    "endpoint": endpoint,
                    "method": method,
                    "success": success,
                    "status_code": response.status_code,
                    "time_ms": elapsed,
                    "is_sse": True,
                    "response": "SSE stream established" if success else None
                }
            
            # Determine success based on expected behavior
            if expect_error:
                # Some endpoints return 400/500 for invalid input - that's expected
                success = response.status_code in [200, 201, 400, 404, 500]
                status_icon = f"{YELLOW}⚠️{RESET}" if success else f"{RED}❌{RESET}"
            else:
                success = response.status_code in [200, 201]
                status_icon = f"{GREEN}✅{RESET}" if success else f"{RED}❌{RESET}"
            
            # Try to parse JSON response
            try:
                response_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text[:200]
            except:
                response_data = response.text[:200]
            
            print(f"{status_icon} {name:45} {response.status_code}  {elapsed:6.0f}ms")
            
            return {
                "name": name,
                "endpoint": endpoint,
                "method": method,
                "success": success,
                "status_code": response.status_code,
                "time_ms": elapsed,
                "is_sse": False,
                "response": response_data
            }
            
        except requests.exceptions.Timeout:
            elapsed = (time.time() - start) * 1000
            print(f"{YELLOW}⏱️{RESET}  {name:45} TIMEOUT {elapsed:6.0f}ms")
            return {
                "name": name,
                "endpoint": endpoint,
                "method": method,
                "success": False,
                "status_code": 0,
                "time_ms": elapsed,
                "error": "Timeout"
            }
        except Exception as e:
            elapsed = (time.time() - start) * 1000
            print(f"{RED}❌{RESET} {name:45} ERROR  {elapsed:6.0f}ms  {str(e)[:50]}")
            return {
                "name": name,
                "endpoint": endpoint,
                "method": method,
                "success": False,
                "status_code": 0,
                "time_ms": elapsed,
                "error": str(e)
            }

    def run_all_tests(self):
        """Run all endpoint tests"""
        print(f"\n{BLUE}{'='*80}{RESET}")
        print(f"{BLUE}CVAULT-239: COMPREHENSIVE API ENDPOINT TEST{RESET}")
        print(f"{BLUE}Time: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}{RESET}")
        print(f"{BLUE}Base URL: {BASE_URL}{RESET}")
        print(f"{BLUE}{'='*80}{RESET}\n")
        
        # Test Health Endpoints
        print(f"{BLUE}### HEALTH ENDPOINTS ###{RESET}")
        self.results.append(self.test_endpoint("Health Check", "GET", "/api/health"))
        self.results.append(self.test_endpoint("Health Check (HEAD)", "HEAD", "/api/health"))
        
        # Test Market Data Endpoints
        print(f"\n{BLUE}### MARKET DATA ENDPOINTS ###{RESET}")
        self.results.append(self.test_endpoint("BTC Price", "GET", "/api/price"))
        self.results.append(self.test_endpoint("Market Data", "GET", "/api/market-data"))
        self.results.append(self.test_endpoint("Price (Invalid Asset)", "GET", "/api/price", params={"asset": "INVALID"}))
        
        # Test Consensus Endpoints
        print(f"\n{BLUE}### CONSENSUS ENDPOINTS ###{RESET}")
        self.results.append(self.test_endpoint("Consensus (SSE)", "GET", "/api/consensus", params={"asset": "BTC"}, is_sse=True))
        self.results.append(self.test_endpoint("Consensus (POST)", "POST", "/api/consensus", 
                          data={"query": "Should Bitcoin reach $100k in 2026?"}))
        self.results.append(self.test_endpoint("Consensus (POST - Missing Params)", "POST", "/api/consensus", 
                          data={}, expect_error=True))
        self.results.append(self.test_endpoint("Consensus Detailed", "GET", "/api/consensus-detailed", params={"asset": "BTC"}))
        self.results.append(self.test_endpoint("Consensus Enhanced", "GET", "/api/consensus-enhanced", params={"asset": "BTC"}))
        
        # Test Council Endpoints
        print(f"\n{BLUE}### COUNCIL ENDPOINTS ###{RESET}")
        self.results.append(self.test_endpoint("Council Evaluate", "POST", "/api/council/evaluate",
                          data={"asset": "BTC", "chatroomContext": {"direction": "bullish", "strength": 85}}))
        
        # Test Trading Endpoints
        print(f"\n{BLUE}### TRADING ENDPOINTS ###{RESET}")
        self.results.append(self.test_endpoint("Trading History", "GET", "/api/trading/history"))
        self.results.append(self.test_endpoint("Trading Execute", "POST", "/api/trading/execute",
                          data={"asset": "BTC/USD"}, expect_error=True))  # May return 400 if no consensus
        self.results.append(self.test_endpoint("Trading Close", "POST", "/api/trading/close",
                          data={"tradeId": "non-existent"}, expect_error=True))  # Expected 500 for non-existent
        
        # Test Prediction Market Endpoints
        print(f"\n{BLUE}### PREDICTION MARKET ENDPOINTS ###{RESET}")
        self.results.append(self.test_endpoint("Prediction Market State", "GET", "/api/prediction-market/bet"))
        self.results.append(self.test_endpoint("Prediction Market Bet", "POST", "/api/prediction-market/bet",
                          data={"address": "demo-address", "amount": 100, "side": "up"}))
        self.results.append(self.test_endpoint("Prediction Market Stream", "GET", "/api/prediction-market/stream", is_sse=True))
        
        # Test Chatroom Endpoints
        print(f"\n{BLUE}### CHATROOM ENDPOINTS ###{RESET}")
        self.results.append(self.test_endpoint("Chatroom Stream", "GET", "/api/chatroom/stream", is_sse=True))
        self.results.append(self.test_endpoint("Chatroom History", "GET", "/api/chatroom/history"))
        self.results.append(self.test_endpoint("Chatroom Summarize", "GET", "/api/chatroom/summarize"))
        self.results.append(self.test_endpoint("Chatroom Consensus Snapshots", "GET", "/api/chatroom/consensus-snapshots"))
        self.results.append(self.test_endpoint("Chatroom Post", "POST", "/api/chatroom/post",
                          data={"userId": "demo-user", "handle": "DemoUser", "content": "Test message for demo"}))
        self.results.append(self.test_endpoint("Chatroom Post (Missing Params)", "POST", "/api/chatroom/post",
                          data={}, expect_error=True))
        self.results.append(self.test_endpoint("Chatroom Admin", "POST", "/api/chatroom/admin",
                          data={"action": "reset", "moderatorId": "admin"}, expect_error=True))
        self.results.append(self.test_endpoint("Chatroom Moderate", "POST", "/api/chatroom/moderate",
                          data={"action": "warn", "targetUserId": "user1", "targetHandle": "User1", 
                                "reason": "Test", "moderatorId": "admin"}, expect_error=True))
        
        # Test Human Chat Endpoints
        print(f"\n{BLUE}### HUMAN CHAT ENDPOINTS ###{RESET}")
        self.results.append(self.test_endpoint("Human Chat Stream", "GET", "/api/human-chat/stream", is_sse=True))
        self.results.append(self.test_endpoint("Human Chat Post", "POST", "/api/human-chat/post",
                          data={"userId": "demo-user", "handle": "DemoUser", "content": "Test human chat message"}))
        self.results.append(self.test_endpoint("Human Chat Post (Missing Params)", "POST", "/api/human-chat/post",
                          data={}, expect_error=True))
        
        # Test Cron/Utility Endpoints
        print(f"\n{BLUE}### CRON/UTILITY ENDPOINTS ###{RESET}")
        self.results.append(self.test_endpoint("Cron Stale Trades", "GET", "/api/cron/stale-trades"))
        self.results.append(self.test_endpoint("Cron Cleanup Rolling History", "GET", "/api/cron/cleanup-rolling-history"))
        
        return self.results

    def generate_summary(self):
        """Generate test summary"""
        print(f"\n{BLUE}{'='*80}{RESET}")
        print(f"{BLUE}TEST SUMMARY{RESET}")
        print(f"{BLUE}{'='*80}{RESET}\n")
        
        total = len(self.results)
        working = sum(1 for r in self.results if r['success'] and r['status_code'] in [200, 201])
        client_errors = sum(1 for r in self.results if r['status_code'] in [400, 404])
        server_errors = sum(1 for r in self.results if r['status_code'] >= 500)
        connection_errors = sum(1 for r in self.results if r['status_code'] == 0)
        sse_working = sum(1 for r in self.results if r.get('is_sse') and r['success'])
        
        print(f"Total Endpoints Tested: {total}")
        print(f"{GREEN}✅ Working (200/201): {working}{RESET}")
        print(f"{YELLOW}⚠️  Client Errors (400/404): {client_errors}{RESET}")
        print(f"{RED}❌ Server Errors (500+): {server_errors}{RESET}")
        print(f"{RED}🔴 Connection Errors: {connection_errors}{RESET}")
        print(f"{GREEN}📡 SSE Streams Working: {sse_working}{RESET}")
        print(f"\nSuccess Rate: {working*100//total}%")
        
        # Working endpoints
        print(f"\n{GREEN}### WORKING ENDPOINTS ###{RESET}")
        for r in self.results:
            if r['success'] and r['status_code'] in [200, 201]:
                sse_marker = " (SSE)" if r.get('is_sse') else ""
                print(f"{GREEN}✅{RESET} {r['method']:6} {r['endpoint']:40} {r['time_ms']:6.0f}ms{sse_marker}")
        
        # Client errors (expected for missing params)
        if client_errors > 0:
            print(f"\n{YELLOW}### CLIENT ERRORS (Expected for invalid input) ###{RESET}")
            for r in self.results:
                if r['status_code'] in [400, 404]:
                    print(f"{YELLOW}⚠️{RESET}  {r['method']:6} {r['endpoint']:40} {r['status_code']} {r['time_ms']:6.0f}ms")
        
        # Server errors
        if server_errors > 0:
            print(f"\n{RED}### SERVER ERRORS (Need Attention) ###{RESET}")
            for r in self.results:
                if r['status_code'] >= 500:
                    print(f"{RED}❌{RESET} {r['method']:6} {r['endpoint']:40} {r['status_code']} {r['time_ms']:6.0f}ms")
        
        # Connection errors
        if connection_errors > 0:
            print(f"\n{RED}### CONNECTION ERRORS (Critical) ###{RESET}")
            for r in self.results:
                if r['status_code'] == 0:
                    error_msg = r.get('error', 'Unknown error')[:60]
                    print(f"{RED}🔴{RESET} {r['method']:6} {r['endpoint']:40} ERROR {r['time_ms']:6.0f}ms - {error_msg}")
        
        return {
            "total": total,
            "working": working,
            "client_errors": client_errors,
            "server_errors": server_errors,
            "connection_errors": connection_errors,
            "sse_working": sse_working
        }

    def generate_report(self, summary):
        """Generate markdown report"""
        report_file = '/home/shazbot/team-consensus-vault/CVAULT-239_COMPREHENSIVE_TEST_REPORT.md'
        
        with open(report_file, 'w') as f:
            f.write("# CVAULT-239: Comprehensive API Endpoint Test Report\n\n")
            f.write(f"**Test Date:** {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}\n")
            f.write(f"**Base URL:** {BASE_URL}\n")
            f.write(f"**Total Endpoints Tested:** {summary['total']}\n\n")
            
            f.write("## Summary\n\n")
            f.write(f"| Status | Count |\n")
            f.write(f"|--------|-------|\n")
            f.write(f"| ✅ Working | {summary['working']} |\n")
            f.write(f"| ⚠️ Client Errors | {summary['client_errors']} |\n")
            f.write(f"| ❌ Server Errors | {summary['server_errors']} |\n")
            f.write(f"| 🔴 Connection Errors | {summary['connection_errors']} |\n")
            f.write(f"| 📡 SSE Working | {summary['sse_working']} |\n\n")
            
            f.write(f"**Overall Success Rate:** {summary['working']*100//summary['total']}%\n\n")
            
            # Detailed results
            f.write("## Detailed Results\n\n")
            
            # Group by category
            categories = {
                "Health": ["Health"],
                "Market Data": ["Price", "Market Data"],
                "Consensus": ["Consensus"],
                "Council": ["Council"],
                "Trading": ["Trading"],
                "Prediction Market": ["Prediction Market"],
                "Chatroom": ["Chatroom"],
                "Human Chat": ["Human Chat"],
                "Cron/Utility": ["Cron"]
            }
            
            for category, keywords in categories.items():
                f.write(f"### {category}\n\n")
                f.write("| Endpoint | Method | Status | Code | Time | Notes |\n")
                f.write("|----------|--------|--------|------|------|-------|\n")
                
                for r in self.results:
                    if any(kw in r['name'] for kw in keywords):
                        status = "✅" if r['success'] and r['status_code'] in [200, 201] else "⚠️" if r['status_code'] in [400, 404] else "❌"
                        sse_note = "SSE" if r.get('is_sse') else ""
                        f.write(f"| {r['name']} | {r['method']} | {status} | {r['status_code']} | {r['time_ms']:.0f}ms | {sse_note} |\n")
                
                f.write("\n")
            
            # Hackathon critical endpoints
            f.write("## Hackathon Demo Critical Endpoints\n\n")
            critical = [
                ("BTC Price", "/api/price"),
                ("Market Data", "/api/market-data"),
                ("Health Check", "/api/health"),
                ("Consensus", "/api/consensus"),
                ("Chatroom Stream", "/api/chatroom/stream"),
                ("Chatroom History", "/api/chatroom/history"),
                ("Chatroom Post", "/api/chatroom/post"),
                ("Prediction Market", "/api/prediction-market/bet"),
                ("Trading History", "/api/trading/history")
            ]
            
            for name, endpoint in critical:
                result = next((r for r in self.results if r['endpoint'] == endpoint), None)
                if result:
                    status = "✅ WORKING" if result['success'] and result['status_code'] in [200, 201] else "❌ FAILED"
                    f.write(f"- **{name}** ({endpoint}): {status}\n")
            
            f.write("\n## Conclusion\n\n")
            if summary['connection_errors'] == 0 and summary['server_errors'] == 0:
                f.write("✅ **All API endpoints are functional.** The hackathon demo can proceed.\n")
            elif summary['connection_errors'] == 0:
                f.write("⚠️ **Most endpoints are functional.** The hackathon demo can proceed with minor limitations.\n")
            else:
                f.write("❌ **Critical endpoints are failing.** Immediate attention needed before demo.\n")
        
        print(f"\n{GREEN}✅ Report saved to: {report_file}{RESET}")
        return report_file

def main():
    tester = EndpointTester()
    tester.run_all_tests()
    summary = tester.generate_summary()
    report_file = tester.generate_report(summary)
    
    # Also save JSON results
    json_file = '/home/shazbot/team-consensus-vault/CVAULT-239_TEST_RESULTS.json'
    with open(json_file, 'w') as f:
        json.dump({
            "timestamp": datetime.utcnow().isoformat(),
            "summary": summary,
            "results": tester.results
        }, f, indent=2, default=str)
    print(f"{GREEN}✅ JSON results saved to: {json_file}{RESET}")
    
    print(f"\n{BLUE}{'='*80}{RESET}")
    
    # Return exit code based on results
    if summary['connection_errors'] > 0:
        return 1
    elif summary['server_errors'] > 0:
        return 2
    else:
        return 0

if __name__ == "__main__":
    sys.exit(main())
