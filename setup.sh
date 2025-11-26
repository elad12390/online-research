#!/bin/bash

# ============================================================================
# Research Portal - Docker Setup
# ============================================================================
# Interactive configuration for Docker Compose deployment
# No local installation required - everything runs in containers
#
# Usage (one-liner):
#   ./setup.sh --anthropic-key sk-ant-xxx --port 3000 --auto
#
# All options:
#   --anthropic-key KEY    Set Anthropic API key
#   --openai-key KEY       Set OpenAI API key  
#   --google-key KEY       Set Google API key
#   --pixabay-key KEY      Set Pixabay API key (for image search)
#   --port PORT            Portal port (default: 3847)
#   --searxng-port PORT    SearXNG port (default: 8847)
#   --research-dir DIR     Research directory (default: ~/Documents/research)
#   --profile PROFILE      Deployment profile: portal, search, full (default: search)
#   --tor                  Enable Tor proxy for searches
#   --engines ENGINES      Comma-separated search engines (default: google,bing,duckduckgo,wikipedia,github,stackoverflow)
#   --auto                 Skip interactive prompts, deploy immediately
#   --no-deploy            Generate .env only, don't deploy
#   -h, --help             Show this help
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
GRAY='\033[0;90m'
NC='\033[0m'
BOLD='\033[1m'
DIM='\033[2m'

CHECK="${GREEN}✓${NC}"
CROSS="${RED}✗${NC}"
ARROW="${CYAN}→${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

# Defaults
PORTAL_PORT=3847
SEARXNG_PORT=8847

# Detect Documents folder (cross-platform)
if [[ "$OSTYPE" == "darwin"* ]]; then
    RESEARCH_DIR="$HOME/Documents/research"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
    RESEARCH_DIR="$USERPROFILE/Documents/research"
else
    # Linux - use XDG if available, fallback to ~/Documents
    RESEARCH_DIR="${XDG_DOCUMENTS_DIR:-$HOME/Documents}/research"
fi
PROFILE="search"  # default: portal + searxng

# Search engines
SEARCH_GOOGLE=true
SEARCH_BING=true
SEARCH_DUCKDUCKGO=true
SEARCH_BRAVE=false
SEARCH_WIKIPEDIA=true
SEARCH_GITHUB=true
SEARCH_STACKOVERFLOW=true
SEARCH_ARXIV=false
SEARCH_REDDIT=false
SEARCH_YOUTUBE=false

# Tor proxy
USE_TOR=false

# API Keys
ANTHROPIC_API_KEY=""
OPENAI_API_KEY=""
GOOGLE_API_KEY=""
PIXABAY_API_KEY=""

# CLI mode flags
AUTO_MODE=false
NO_DEPLOY=false

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --anthropic-key)
                ANTHROPIC_API_KEY="$2"
                shift 2
                ;;
            --openai-key)
                OPENAI_API_KEY="$2"
                shift 2
                ;;
            --google-key)
                GOOGLE_API_KEY="$2"
                shift 2
                ;;
            --pixabay-key)
                PIXABAY_API_KEY="$2"
                shift 2
                ;;
            --port)
                PORTAL_PORT="$2"
                shift 2
                ;;
            --searxng-port)
                SEARXNG_PORT="$2"
                shift 2
                ;;
            --research-dir)
                RESEARCH_DIR="$2"
                shift 2
                ;;
            --profile)
                case "$2" in
                    portal) PROFILE="" ;;
                    search) PROFILE="search" ;;
                    full) PROFILE="full" ;;
                    *) echo "Invalid profile: $2 (use: portal, search, full)"; exit 1 ;;
                esac
                shift 2
                ;;
            --tor)
                USE_TOR=true
                shift
                ;;
            --engines)
                # Reset all engines to false first
                SEARCH_GOOGLE=false
                SEARCH_BING=false
                SEARCH_DUCKDUCKGO=false
                SEARCH_BRAVE=false
                SEARCH_WIKIPEDIA=false
                SEARCH_GITHUB=false
                SEARCH_STACKOVERFLOW=false
                SEARCH_ARXIV=false
                SEARCH_REDDIT=false
                SEARCH_YOUTUBE=false
                # Enable specified engines
                IFS=',' read -ra ENGINES <<< "$2"
                for engine in "${ENGINES[@]}"; do
                    engine_lower=$(echo "$engine" | tr '[:upper:]' '[:lower:]')
                    case "$engine_lower" in
                        google) SEARCH_GOOGLE=true ;;
                        bing) SEARCH_BING=true ;;
                        duckduckgo|ddg) SEARCH_DUCKDUCKGO=true ;;
                        brave) SEARCH_BRAVE=true ;;
                        wikipedia|wiki) SEARCH_WIKIPEDIA=true ;;
                        github|gh) SEARCH_GITHUB=true ;;
                        stackoverflow|so) SEARCH_STACKOVERFLOW=true ;;
                        arxiv) SEARCH_ARXIV=true ;;
                        reddit) SEARCH_REDDIT=true ;;
                        youtube|yt) SEARCH_YOUTUBE=true ;;
                        *) echo "Unknown engine: $engine"; exit 1 ;;
                    esac
                done
                shift 2
                ;;
            --auto|-y)
                AUTO_MODE=true
                shift
                ;;
            --no-deploy)
                NO_DEPLOY=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
}

show_help() {
    cat << 'EOF'
Research Portal - Docker Setup

Usage:
  ./setup.sh [OPTIONS]

Options:
  --anthropic-key KEY    Set Anthropic API key (Claude)
  --openai-key KEY       Set OpenAI API key (GPT)
  --google-key KEY       Set Google API key (Gemini)
  --pixabay-key KEY      Set Pixabay API key (image search)
  --port PORT            Portal port (default: 3847)
  --searxng-port PORT    SearXNG port (default: 8847)
  --research-dir DIR     Research directory (default: ~/Documents/research)
  --profile PROFILE      Deployment profile:
                           portal - Just the web portal
                           search - Portal + SearXNG (default)
                           full   - Portal + SearXNG + Redis cache
  --tor                  Enable Tor proxy for searches
  --engines ENGINES      Comma-separated search engines:
                           google, bing, duckduckgo, brave, wikipedia,
                           github, stackoverflow, arxiv, reddit, youtube
  --auto, -y             Skip interactive prompts, deploy immediately
  --no-deploy            Generate .env only, don't deploy
  -h, --help             Show this help

Examples:
  # Quick setup with Anthropic key
  ./setup.sh --anthropic-key sk-ant-xxx --auto

  # Custom port and directory
  ./setup.sh --anthropic-key sk-ant-xxx --port 3000 --research-dir ~/research --auto

  # Full setup with Tor and specific engines
  ./setup.sh --anthropic-key sk-ant-xxx --profile full --tor --engines google,github,arxiv --auto

  # Generate .env without deploying
  ./setup.sh --anthropic-key sk-ant-xxx --no-deploy
EOF
}

print_banner() {
    clear
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}   ${BOLD}${WHITE}Research Portal - Docker Setup${NC}                              ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}   ${DIM}Configure and deploy with Docker Compose${NC}                     ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}${WHITE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

ask_yes_no() {
    local prompt="$1" default="$2"
    [ "$default" = "y" ] && prompt="$prompt ${DIM}[Y/n]${NC}" || prompt="$prompt ${DIM}[y/N]${NC}"
    echo -ne "  ${CYAN}?${NC} $prompt " >&2
    read -r result
    [ -z "$result" ] && result="$default"
    [[ "$result" =~ ^[yY] ]]
}

ask_input() {
    local prompt="$1" default="$2"
    echo -ne "  ${CYAN}?${NC} $prompt ${DIM}[$default]${NC}: " >&2
    read -r result
    echo "${result:-$default}"
}

ask_secret() {
    local prompt="$1"
    echo -ne "  ${CYAN}?${NC} $prompt: " >&2
    read -rs result
    echo "" >&2
    echo "$result"
}

select_search_engines() {
    local engines=("Google" "Bing" "DuckDuckGo" "Brave" "Wikipedia" "GitHub" "StackOverflow" "arXiv" "Reddit" "YouTube")
    local selected=("$SEARCH_GOOGLE" "$SEARCH_BING" "$SEARCH_DUCKDUCKGO" "$SEARCH_BRAVE" "$SEARCH_WIKIPEDIA" "$SEARCH_GITHUB" "$SEARCH_STACKOVERFLOW" "$SEARCH_ARXIV" "$SEARCH_REDDIT" "$SEARCH_YOUTUBE")
    local current=0 total=${#engines[@]}
    
    echo -e "\n  ${BOLD}Select search engines${NC} ${DIM}(↑/↓ navigate, Space toggle, Enter confirm)${NC}\n"
    
    tput civis 2>/dev/null || true
    local first_draw=""
    
    while true; do
        [ "$first_draw" = "true" ] && for ((i=0; i<total; i++)); do tput cuu1 2>/dev/null || echo -ne "\033[1A"; done
        first_draw="true"
        
        for ((i=0; i<total; i++)); do
            local box="[ ]" color="$GRAY"
            [ "${selected[$i]}" = "true" ] && box="[✓]" && color="$GREEN"
            [ $i -eq $current ] && echo -e "  ${CYAN}❯${NC} ${color}${box}${NC} ${WHITE}${engines[$i]}${NC}     " || echo -e "    ${color}${box}${NC} ${engines[$i]}     "
        done
        
        # Read a single character
        IFS= read -rsn1 key
        
        # Handle escape sequences (arrow keys)
        if [ "$key" = $'\x1b' ]; then
            read -rsn2 seq
            key="$seq"
        fi
        
        case "$key" in
            '[A') 
                if [ $current -gt 0 ]; then
                    current=$((current - 1))
                else
                    current=$((total - 1))
                fi
                ;;
            '[B') 
                if [ $current -lt $((total - 1)) ]; then
                    current=$((current + 1))
                else
                    current=0
                fi
                ;;
            ' ') 
                if [ "${selected[$current]}" = "true" ]; then
                    selected[$current]="false"
                else
                    selected[$current]="true"
                fi
                ;;
            '') break ;;
        esac
    done
    
    tput cnorm 2>/dev/null || true
    
    SEARCH_GOOGLE="${selected[0]}" SEARCH_BING="${selected[1]}" SEARCH_DUCKDUCKGO="${selected[2]}"
    SEARCH_BRAVE="${selected[3]}" SEARCH_WIKIPEDIA="${selected[4]}" SEARCH_GITHUB="${selected[5]}"
    SEARCH_STACKOVERFLOW="${selected[6]}" SEARCH_ARXIV="${selected[7]}" SEARCH_REDDIT="${selected[8]}"
    SEARCH_YOUTUBE="${selected[9]}"
}

check_prerequisites() {
    print_section "Checking Prerequisites"
    
    local os_type=""
    local docker_installed=false
    local docker_running=false
    
    # Detect OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        os_type="macos"
        echo -e "  ${CHECK} Detected: ${WHITE}macOS${NC}"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        os_type="linux"
        echo -e "  ${CHECK} Detected: ${WHITE}Linux${NC}"
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
        os_type="windows"
        echo -e "  ${CHECK} Detected: ${WHITE}Windows${NC}"
    else
        os_type="unknown"
        echo -e "  ${YELLOW}!${NC} Unknown OS: $OSTYPE"
    fi
    
    echo ""
    
    # Check for Docker
    if command -v docker &>/dev/null; then
        docker_installed=true
        local docker_version=$(docker --version 2>/dev/null | cut -d' ' -f3 | tr -d ',')
        echo -e "  ${CHECK} Docker installed ${DIM}(v$docker_version)${NC}"
    else
        echo -e "  ${CROSS} ${RED}Docker not found${NC}"
        echo ""
        
        case "$os_type" in
            macos)
                echo -e "  ${WHITE}Install Docker on macOS:${NC}"
                echo -e "  ${GRAY}Option 1 - Docker Desktop (easiest):${NC}"
                echo -e "    ${CYAN}brew install --cask docker${NC}"
                echo -e "    ${DIM}Then open Docker.app from Applications${NC}"
                echo ""
                echo -e "  ${GRAY}Option 2 - Colima (lightweight, CLI-only):${NC}"
                echo -e "    ${CYAN}brew install colima docker${NC}"
                echo -e "    ${CYAN}colima start${NC}"
                ;;
            linux)
                echo -e "  ${WHITE}Install Docker on Linux:${NC}"
                echo -e "  ${GRAY}Ubuntu/Debian:${NC}"
                echo -e "    ${CYAN}curl -fsSL https://get.docker.com | sh${NC}"
                echo -e "    ${CYAN}sudo usermod -aG docker \$USER${NC}"
                echo ""
                echo -e "  ${GRAY}Then log out and back in, or run:${NC}"
                echo -e "    ${CYAN}newgrp docker${NC}"
                ;;
            windows)
                echo -e "  ${WHITE}Install Docker on Windows:${NC}"
                echo -e "  ${GRAY}Option 1 - Docker Desktop:${NC}"
                echo -e "    ${CYAN}winget install Docker.DockerDesktop${NC}"
                echo ""
                echo -e "  ${GRAY}Option 2 - Download from:${NC}"
                echo -e "    ${CYAN}https://docs.docker.com/desktop/install/windows-install/${NC}"
                ;;
            *)
                echo -e "  ${GRAY}Install from: ${CYAN}https://docs.docker.com/get-docker/${NC}"
                ;;
        esac
        echo ""
        exit 1
    fi
    
    # Check if Docker daemon is running
    if docker info &>/dev/null; then
        docker_running=true
        echo -e "  ${CHECK} Docker daemon is running"
    else
        echo -e "  ${CROSS} ${RED}Docker daemon is not running${NC}"
        echo ""
        
        case "$os_type" in
            macos)
                # Check if Colima is installed
                if command -v colima &>/dev/null; then
                    echo -e "  ${WHITE}Colima detected. Start it with:${NC}"
                    echo -e "    ${CYAN}colima start${NC}"
                    echo ""
                    if ask_yes_no "Start Colima now?" "y"; then
                        echo -e "  ${ARROW} Starting Colima..."
                        if colima start 2>/dev/null; then
                            echo -e "  ${CHECK} Colima started"
                            docker_running=true
                        else
                            echo -e "  ${CROSS} Failed to start Colima"
                            exit 1
                        fi
                    else
                        exit 1
                    fi
                else
                    echo -e "  ${WHITE}Start Docker:${NC}"
                    echo -e "  ${GRAY}If using Docker Desktop:${NC}"
                    echo -e "    ${CYAN}open -a Docker${NC}"
                    echo ""
                    echo -e "  ${GRAY}If using Colima:${NC}"
                    echo -e "    ${CYAN}brew install colima && colima start${NC}"
                fi
                ;;
            linux)
                echo -e "  ${WHITE}Start Docker daemon:${NC}"
                echo -e "    ${CYAN}sudo systemctl start docker${NC}"
                echo ""
                echo -e "  ${GRAY}To start on boot:${NC}"
                echo -e "    ${CYAN}sudo systemctl enable docker${NC}"
                ;;
            windows)
                echo -e "  ${WHITE}Start Docker Desktop from the Start menu${NC}"
                echo -e "  ${GRAY}Or run:${NC}"
                echo -e "    ${CYAN}\"C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe\"${NC}"
                ;;
        esac
        
        if [ "$docker_running" = false ]; then
            echo ""
            exit 1
        fi
    fi
    
    # Check docker compose
    if docker compose version &>/dev/null; then
        local compose_version=$(docker compose version --short 2>/dev/null)
        echo -e "  ${CHECK} Docker Compose available ${DIM}(v$compose_version)${NC}"
    elif command -v docker-compose &>/dev/null; then
        echo -e "  ${CHECK} Docker Compose available ${DIM}(standalone)${NC}"
    else
        echo -e "  ${CROSS} ${RED}Docker Compose not found${NC}"
        echo -e "  ${GRAY}Install with: ${CYAN}https://docs.docker.com/compose/install/${NC}"
        exit 1
    fi
}

configure() {
    print_section "Configuration"
    
    # Ports
    PORTAL_PORT=$(ask_input "Portal port" "$PORTAL_PORT")
    SEARXNG_PORT=$(ask_input "SearXNG port" "$SEARXNG_PORT")
    
    # Research directory
    echo ""
    RESEARCH_DIR=$(ask_input "Research directory" "$RESEARCH_DIR")
    # Expand to absolute path (handles ~, relative paths, etc.)
    RESEARCH_DIR=$(eval echo "$RESEARCH_DIR")
    RESEARCH_DIR=$(cd "$(dirname "$RESEARCH_DIR")" 2>/dev/null && pwd)/$(basename "$RESEARCH_DIR") || RESEARCH_DIR=$(realpath -m "$RESEARCH_DIR" 2>/dev/null) || RESEARCH_DIR="$RESEARCH_DIR"
    
    if [ ! -d "$RESEARCH_DIR" ]; then
        mkdir -p "$RESEARCH_DIR" && echo -e "  ${CHECK} Created $RESEARCH_DIR"
    else
        echo -e "  ${CHECK} Using $RESEARCH_DIR"
    fi
    
    # Profile selection
    echo ""
    echo -e "  ${WHITE}Deployment profile:${NC}"
    echo -e "    ${GRAY}1) portal       - Just the web portal${NC}"
    echo -e "    ${GRAY}2) search       - Portal + SearXNG (recommended)${NC}"
    echo -e "    ${GRAY}3) full         - Portal + SearXNG + Redis cache${NC}"
    local profile_choice=$(ask_input "Choose profile" "2")
    case "$profile_choice" in
        1) PROFILE="" ;;
        3) PROFILE="full" ;;
        *) PROFILE="search" ;;
    esac
    
    # Tor proxy option
    echo ""
    echo -e "  ${WHITE}Tor Proxy${NC}"
    echo -e "  ${GRAY}Route searches through Tor to avoid rate limiting/blocking${NC}"
    echo -e "  ${GRAY}Note: Slower but more anonymous and resilient${NC}"
    if ask_yes_no "Enable Tor proxy for searches?" "n"; then
        USE_TOR=true
    fi
    
    # Search engines
    print_section "Search Engines"
    select_search_engines
    
    # API Keys
    print_section "API Keys"
    echo -e "  ${GRAY}At least one AI provider key is needed for research features${NC}"
    echo -e "  ${GRAY}Press Enter to skip any provider${NC}"
    echo ""
    
    echo -e "  ${WHITE}Anthropic (Claude)${NC} - ${CYAN}https://console.anthropic.com/settings/keys${NC}"
    ANTHROPIC_API_KEY=$(ask_secret "ANTHROPIC_API_KEY")
    if [ -n "$ANTHROPIC_API_KEY" ]; then echo -e "  ${CHECK} Configured"; fi
    
    echo ""
    echo -e "  ${WHITE}OpenAI (GPT)${NC} - ${CYAN}https://platform.openai.com/api-keys${NC}"
    OPENAI_API_KEY=$(ask_secret "OPENAI_API_KEY")
    if [ -n "$OPENAI_API_KEY" ]; then echo -e "  ${CHECK} Configured"; fi
    
    echo ""
    echo -e "  ${WHITE}Google AI (Gemini)${NC} - ${CYAN}https://makersuite.google.com/app/apikey${NC}"
    GOOGLE_API_KEY=$(ask_secret "GOOGLE_API_KEY")
    if [ -n "$GOOGLE_API_KEY" ]; then echo -e "  ${CHECK} Configured"; fi
    
    echo ""
    echo -e "  ${WHITE}Pixabay (Image Search)${NC} - ${CYAN}https://pixabay.com/api/docs/${NC}"
    echo -e "  ${GRAY}Optional: Enables image search in research${NC}"
    PIXABAY_API_KEY=$(ask_secret "PIXABAY_API_KEY")
    if [ -n "$PIXABAY_API_KEY" ]; then echo -e "  ${CHECK} Configured"; fi
}

generate_env() {
    print_section "Generating .env"
    
    cat > "$ENV_FILE" << EOF
# Research Portal - Docker Configuration
# Generated on $(date)

# Ports
PORTAL_PORT=$PORTAL_PORT
SEARXNG_PORT=$SEARXNG_PORT

# Directories
RESEARCH_DIR=$RESEARCH_DIR

# API Keys
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
OPENAI_API_KEY=$OPENAI_API_KEY
GOOGLE_API_KEY=$GOOGLE_API_KEY
PIXABAY_API_KEY=$PIXABAY_API_KEY

# Search Engines
SEARCH_GOOGLE=$SEARCH_GOOGLE
SEARCH_BING=$SEARCH_BING
SEARCH_DUCKDUCKGO=$SEARCH_DUCKDUCKGO
SEARCH_BRAVE=$SEARCH_BRAVE
SEARCH_WIKIPEDIA=$SEARCH_WIKIPEDIA
SEARCH_GITHUB=$SEARCH_GITHUB
SEARCH_STACKOVERFLOW=$SEARCH_STACKOVERFLOW
SEARCH_ARXIV=$SEARCH_ARXIV
SEARCH_REDDIT=$SEARCH_REDDIT
SEARCH_YOUTUBE=$SEARCH_YOUTUBE

# Tor Proxy
USE_TOR=$USE_TOR

# Security
SEARXNG_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "change-me-$(date +%s)")
EOF

    echo -e "  ${CHECK} Saved to .env"
}

# Spinner for waiting
spin() {
    local pid=$1
    local delay=0.1
    local spinstr='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
    while ps -p "$pid" > /dev/null 2>&1; do
        for ((i=0; i<${#spinstr}; i++)); do
            echo -ne "\r  ${CYAN}${spinstr:$i:1}${NC} $2" >&2
            sleep $delay
        done
    done
    echo -ne "\r" >&2
}

# Check if a container is healthy
check_container_health() {
    local container=$1
    local status=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null)
    
    if [ -z "$status" ]; then
        # No healthcheck defined, check if running
        local running=$(docker inspect --format='{{.State.Running}}' "$container" 2>/dev/null)
        [ "$running" = "true" ] && echo "running" || echo "stopped"
    else
        echo "$status"
    fi
}

# Wait for container to be healthy with live status
wait_for_healthy() {
    local container=$1
    local display_name=$2
    local max_wait=${3:-120}
    local start_time=$(date +%s)
    
    while true; do
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        
        if [ $elapsed -ge $max_wait ]; then
            echo -e "\r  ${CROSS} ${display_name}: ${RED}timeout${NC}          "
            return 1
        fi
        
        local health=$(check_container_health "$container")
        local elapsed_str="${elapsed}s"
        
        case "$health" in
            healthy|running)
                echo -e "\r  ${CHECK} ${display_name}: ${GREEN}ready${NC}              "
                return 0
                ;;
            starting)
                echo -ne "\r  ${YELLOW}◐${NC} ${display_name}: ${YELLOW}starting${NC} ${DIM}(${elapsed_str})${NC}    " >&2
                ;;
            unhealthy)
                echo -e "\r  ${CROSS} ${display_name}: ${RED}unhealthy${NC}          "
                return 1
                ;;
            *)
                echo -ne "\r  ${YELLOW}◐${NC} ${display_name}: ${GRAY}waiting${NC} ${DIM}(${elapsed_str})${NC}     " >&2
                ;;
        esac
        
        sleep 1
    done
}

# Special wait for Tor (checks bootstrap progress)
wait_for_tor() {
    local max_wait=${1:-180}
    local start_time=$(date +%s)
    
    while true; do
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        
        if [ $elapsed -ge $max_wait ]; then
            echo -e "\r  ${CROSS} Tor Proxy: ${RED}timeout${NC}              "
            return 1
        fi
        
        # Check bootstrap progress
        local bootstrap=$(docker logs research-tor 2>&1 | grep "Bootstrapped" | tail -1 | grep -oE '[0-9]+%' | tr -d '%')
        
        if [ -n "$bootstrap" ]; then
            if [ "$bootstrap" -ge 100 ]; then
                echo -e "\r  ${CHECK} Tor Proxy: ${GREEN}connected${NC}            "
                return 0
            else
                echo -ne "\r  ${YELLOW}◐${NC} Tor Proxy: ${YELLOW}bootstrapping ${bootstrap}%${NC} ${DIM}(${elapsed}s)${NC}    " >&2
            fi
        else
            echo -ne "\r  ${YELLOW}◐${NC} Tor Proxy: ${GRAY}initializing${NC} ${DIM}(${elapsed}s)${NC}    " >&2
        fi
        
        sleep 2
    done
}

# Check HTTP endpoint
check_http_ready() {
    local url=$1
    local max_wait=${2:-60}
    local start_time=$(date +%s)
    
    while true; do
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        
        if [ $elapsed -ge $max_wait ]; then
            return 1
        fi
        
        local status=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
        if [ "$status" = "200" ]; then
            return 0
        fi
        
        sleep 1
    done
}

configure_searxng_tor() {
    local settings_file="$SCRIPT_DIR/searxng/settings.yml"
    
    if [ "$USE_TOR" = "true" ]; then
        # Enable Tor proxy in SearXNG settings
        if grep -q "# proxies:" "$settings_file"; then
            sed -i.bak 's/# proxies:/proxies:/; s/#   all:\/\/:/  all:\/\/:/; s/#     - socks5h:\/\/tor:9050/    - socks5h:\/\/tor:9050/; s/# using_tor_proxy: true/using_tor_proxy: true/' "$settings_file"
            rm -f "${settings_file}.bak"
        fi
    else
        # Ensure Tor proxy is disabled
        if grep -q "^proxies:" "$settings_file"; then
            sed -i.bak 's/^proxies:/# proxies:/; s/^  all:\/\/:/#   all:\/\/:/; s/^    - socks5h:\/\/tor:9050/#     - socks5h:\/\/tor:9050/; s/^using_tor_proxy: true/# using_tor_proxy: true/' "$settings_file"
            rm -f "${settings_file}.bak"
        fi
    fi
}

deploy() {
    print_section "Deploying"
    
    # Configure SearXNG for Tor if enabled
    configure_searxng_tor
    
    # Build profile flags
    local profile_flags=""
    if [ "$USE_TOR" = "true" ]; then
        # When Tor is enabled, use full-tor profile (includes portal, searxng, tor, redis)
        profile_flags="--profile full-tor"
    elif [ -n "$PROFILE" ]; then
        profile_flags="--profile $PROFILE"
    fi
    
    # Build images
    echo -e "  ${ARROW} Building images..."
    if ! docker compose $profile_flags build --quiet 2>/dev/null; then
        echo -e "  ${CROSS} ${RED}Build failed${NC}"
        echo -e "  ${GRAY}Run 'docker compose $profile_flags build' for details${NC}"
        exit 1
    fi
    echo -e "  ${CHECK} Images built"
    
    # Start services
    echo -e "  ${ARROW} Starting containers..."
    if ! docker compose $profile_flags up -d 2>&1 | tee /tmp/docker-compose-up.log | grep -v "^$" | head -20; then
        echo -e "  ${CROSS} ${RED}Failed to start containers${NC}"
        echo -e "  ${GRAY}Error details:${NC}"
        cat /tmp/docker-compose-up.log | tail -10
        echo ""
        echo -e "  ${GRAY}This is often caused by network issues. Try again or check your internet connection.${NC}"
        exit 1
    fi
    
    # Verify containers actually started
    local running_containers=$(docker compose $profile_flags ps -q 2>/dev/null | wc -l)
    if [ "$running_containers" -eq 0 ]; then
        echo -e "  ${CROSS} ${RED}No containers started${NC}"
        echo -e "  ${GRAY}Check logs with: docker compose $profile_flags logs${NC}"
        exit 1
    fi
    
    echo -e "  ${CHECK} Containers started"
    echo ""
    
    # Wait for services to be healthy
    print_section "Waiting for Services"
    
    local all_healthy=true
    
    # Portal (doesn't depend on Tor)
    echo -ne "  ${YELLOW}◐${NC} Portal: ${GRAY}waiting${NC}    " >&2
    if wait_for_healthy "research-portal" "Portal" 90; then
        : # success
    else
        all_healthy=false
    fi
    
    # Redis (if full profile or full-tor) - doesn't depend on Tor
    if [ "$PROFILE" = "full" ] || [ "$USE_TOR" = "true" ]; then
        echo -ne "  ${YELLOW}◐${NC} Redis: ${GRAY}waiting${NC}    " >&2
        if wait_for_healthy "research-redis" "Redis" 30; then
            : # success
        else
            all_healthy=false
        fi
    fi
    
    # Tor (if enabled) - wait for this BEFORE SearXNG since SearXNG uses Tor proxy
    if [ "$USE_TOR" = "true" ]; then
        echo -ne "  ${YELLOW}◐${NC} Tor Proxy: ${GRAY}initializing${NC}    " >&2
        if wait_for_tor 180; then
            : # success
        else
            echo -e "  ${YELLOW}!${NC} Tor Proxy: ${YELLOW}still bootstrapping${NC} ${DIM}(will continue in background)${NC}"
        fi
    fi
    
    # SearXNG (if enabled) - wait for Tor first if Tor is enabled
    if [ -n "$PROFILE" ]; then
        echo -ne "  ${YELLOW}◐${NC} SearXNG: ${GRAY}waiting${NC}    " >&2
        # Give SearXNG more time when Tor is enabled (needs Tor to be ready)
        local searxng_timeout=60
        if [ "$USE_TOR" = "true" ]; then
            searxng_timeout=120
        fi
        if wait_for_healthy "research-searxng" "SearXNG" $searxng_timeout; then
            : # success
        else
            all_healthy=false
        fi
    fi
    
    # Web Research Assistant (if search/full profile enabled)
    if [ -n "$PROFILE" ]; then
        echo -ne "  ${YELLOW}◐${NC} Web Research: ${GRAY}waiting${NC}    " >&2
        # Give web-research more time to start (needs Playwright/crawl4ai)
        if wait_for_healthy "research-web-assistant" "Web Research" 120; then
            : # success
        else
            # Web research may report unhealthy due to SSE endpoint check timing
            echo -e "  ${YELLOW}!${NC} Web Research: ${YELLOW}may still be starting${NC} ${DIM}(check logs if issues)${NC}"
        fi
    fi
    
    echo ""
    
    # Verify HTTP endpoints
    print_section "Verifying Endpoints"
    
    echo -ne "  ${YELLOW}◐${NC} Checking Portal HTTP... " >&2
    if check_http_ready "http://localhost:$PORTAL_PORT" 30; then
        echo -e "\r  ${CHECK} Portal HTTP: ${GREEN}http://localhost:$PORTAL_PORT${NC}     "
    else
        echo -e "\r  ${CROSS} Portal HTTP: ${RED}not responding${NC}              "
        all_healthy=false
    fi
    
    if [ -n "$PROFILE" ]; then
        echo -ne "  ${YELLOW}◐${NC} Checking SearXNG HTTP... " >&2
        if check_http_ready "http://localhost:$SEARXNG_PORT" 30; then
            echo -e "\r  ${CHECK} SearXNG HTTP: ${GREEN}http://localhost:$SEARXNG_PORT${NC}    "
        else
            echo -e "\r  ${CROSS} SearXNG HTTP: ${RED}not responding${NC}             "
            all_healthy=false
        fi
    fi
    
    if [ "$all_healthy" = true ]; then
        echo ""
        echo -e "  ${CHECK} ${GREEN}${BOLD}All services are healthy!${NC}"
    else
        echo ""
        echo -e "  ${YELLOW}!${NC} ${YELLOW}Some services may still be starting${NC}"
        echo -e "  ${GRAY}Check logs with: docker compose logs -f${NC}"
    fi
}

show_summary() {
    print_section "Ready!"
    
    echo -e "  ${WHITE}Access your services:${NC}"
    echo -e "    ${CYAN}Portal:${NC}  http://localhost:$PORTAL_PORT"
    if [ -n "$PROFILE" ]; then
        echo -e "    ${CYAN}SearXNG:${NC} http://localhost:$SEARXNG_PORT"
    fi
    if [ "$USE_TOR" = "true" ]; then
        echo -e "    ${CYAN}Tor:${NC}     enabled (searches proxied through Tor)"
    fi
    
    echo ""
    echo -e "  ${WHITE}Useful commands:${NC}"
    echo -e "    ${GRAY}docker compose logs -f${NC}       View live logs"
    echo -e "    ${GRAY}docker compose ps${NC}            Check status"
    echo -e "    ${GRAY}docker compose restart${NC}       Restart services"
    echo -e "    ${GRAY}docker compose down${NC}          Stop and remove"
    echo ""
    echo -e "  ${GREEN}${BOLD}Setup complete!${NC} Open ${CYAN}http://localhost:$PORTAL_PORT${NC} in your browser."
    echo ""
}

# Main
main() {
    # Parse command line arguments first
    parse_args "$@"
    
    print_banner
    check_prerequisites
    
    # In auto mode, skip interactive configuration
    if [ "$AUTO_MODE" = true ]; then
        echo -e "  ${ARROW} Running in auto mode with provided arguments"
        echo ""
        
        # Expand research dir to absolute path
        RESEARCH_DIR=$(eval echo "$RESEARCH_DIR")
        RESEARCH_DIR=$(cd "$(dirname "$RESEARCH_DIR")" 2>/dev/null && pwd)/$(basename "$RESEARCH_DIR") || RESEARCH_DIR=$(realpath -m "$RESEARCH_DIR" 2>/dev/null) || RESEARCH_DIR="$RESEARCH_DIR"
        
        # Create research directory if needed
        if [ ! -d "$RESEARCH_DIR" ]; then
            mkdir -p "$RESEARCH_DIR" && echo -e "  ${CHECK} Created $RESEARCH_DIR"
        fi
        
        # Show configuration summary
        echo -e "  ${WHITE}Configuration:${NC}"
        echo -e "    Portal port:    ${CYAN}$PORTAL_PORT${NC}"
        echo -e "    SearXNG port:   ${CYAN}$SEARXNG_PORT${NC}"
        echo -e "    Research dir:   ${CYAN}$RESEARCH_DIR${NC}"
        echo -e "    Profile:        ${CYAN}${PROFILE:-portal}${NC}"
        echo -e "    Tor proxy:      ${CYAN}$USE_TOR${NC}"
        [ -n "$ANTHROPIC_API_KEY" ] && echo -e "    Anthropic:      ${GREEN}configured${NC}"
        [ -n "$OPENAI_API_KEY" ] && echo -e "    OpenAI:         ${GREEN}configured${NC}"
        [ -n "$GOOGLE_API_KEY" ] && echo -e "    Google:         ${GREEN}configured${NC}"
        [ -n "$PIXABAY_API_KEY" ] && echo -e "    Pixabay:        ${GREEN}configured${NC}"
        echo ""
    else
        configure
    fi
    
    generate_env
    
    if [ "$NO_DEPLOY" = true ]; then
        echo ""
        echo -e "  ${CHECK} Configuration saved to .env"
        echo -e "  ${GRAY}To deploy later:${NC}"
        [ -n "$PROFILE" ] && echo -e "    ${CYAN}docker compose --profile $PROFILE up -d${NC}" || echo -e "    ${CYAN}docker compose up -d${NC}"
        echo ""
        exit 0
    fi
    
    if [ "$AUTO_MODE" = true ]; then
        deploy
    else
        echo ""
        if ask_yes_no "Deploy now?" "y"; then
            deploy
        else
            echo ""
            echo -e "  ${GRAY}To deploy later:${NC}"
            [ -n "$PROFILE" ] && echo -e "    ${CYAN}docker compose --profile $PROFILE up -d${NC}" || echo -e "    ${CYAN}docker compose up -d${NC}"
        fi
    fi
    
    show_summary
}

main "$@"
