#!/bin/bash

# ============================================================================
# Research Portal - Uninstall Script
# ============================================================================
# Removes Docker containers, images, volumes, and configuration
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
GRAY='\033[0;90m'
NC='\033[0m'
BOLD='\033[1m'

CHECK="${GREEN}✓${NC}"
CROSS="${RED}✗${NC}"
ARROW="${CYAN}→${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

print_banner() {
    echo ""
    echo -e "${RED}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║${NC}   ${BOLD}${WHITE}Research Portal - Uninstall${NC}                                 ${RED}║${NC}"
    echo -e "${RED}║${NC}   ${GRAY}Remove containers, images, and configuration${NC}                ${RED}║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_section() {
    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}${WHITE}  $1${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

ask_yes_no() {
    local prompt="$1" default="$2"
    if [ "$default" = "y" ]; then
        prompt="$prompt [Y/n]"
    else
        prompt="$prompt [y/N]"
    fi
    echo -ne "  ${CYAN}?${NC} $prompt " >&2
    read -r result
    [ -z "$result" ] && result="$default"
    [[ "$result" =~ ^[yY] ]]
}

stop_containers() {
    print_section "Stopping Containers"
    
    echo -e "  ${ARROW} Stopping all Research Portal containers..."
    
    cd "$SCRIPT_DIR"
    
    # Try different profile combinations to catch all containers
    docker compose --profile full-tor down 2>/dev/null || true
    docker compose --profile full down 2>/dev/null || true
    docker compose --profile search down 2>/dev/null || true
    docker compose down 2>/dev/null || true
    
    echo -e "  ${CHECK} Containers stopped"
}

remove_volumes() {
    print_section "Removing Volumes"
    
    echo -e "  ${GRAY}This will delete cached data (SearXNG cache, Redis data, etc.)${NC}"
    
    if ask_yes_no "Remove Docker volumes?" "y"; then
        docker volume rm research-portal-data 2>/dev/null && echo -e "  ${CHECK} Removed research-portal-data" || echo -e "  ${GRAY}research-portal-data not found${NC}"
        docker volume rm research-searxng-data 2>/dev/null && echo -e "  ${CHECK} Removed research-searxng-data" || echo -e "  ${GRAY}research-searxng-data not found${NC}"
        docker volume rm research-redis-data 2>/dev/null && echo -e "  ${CHECK} Removed research-redis-data" || echo -e "  ${GRAY}research-redis-data not found${NC}"
    else
        echo -e "  ${GRAY}Skipped volume removal${NC}"
    fi
}

remove_images() {
    print_section "Removing Images"
    
    echo -e "  ${GRAY}This will free up disk space but require rebuild on next install${NC}"
    
    if ask_yes_no "Remove Docker images?" "y"; then
        docker rmi research-portal:latest 2>/dev/null && echo -e "  ${CHECK} Removed research-portal:latest" || echo -e "  ${GRAY}research-portal:latest not found${NC}"
        
        if ask_yes_no "Also remove SearXNG and other pulled images?" "n"; then
            docker rmi searxng/searxng:latest 2>/dev/null && echo -e "  ${CHECK} Removed searxng/searxng:latest" || true
            docker rmi dperson/torproxy:latest 2>/dev/null && echo -e "  ${CHECK} Removed dperson/torproxy:latest" || true
            docker rmi redis:alpine 2>/dev/null && echo -e "  ${CHECK} Removed redis:alpine" || true
        fi
    else
        echo -e "  ${GRAY}Skipped image removal${NC}"
    fi
}

remove_network() {
    print_section "Removing Network"
    
    docker network rm research-network 2>/dev/null && echo -e "  ${CHECK} Removed research-network" || echo -e "  ${GRAY}research-network not found or in use${NC}"
}

remove_config() {
    print_section "Removing Configuration"
    
    if [ -f "$SCRIPT_DIR/.env" ]; then
        echo -e "  ${YELLOW}!${NC} Found .env file with your configuration"
        echo -e "  ${GRAY}This contains your API keys and settings${NC}"
        
        if ask_yes_no "Remove .env file?" "n"; then
            rm -f "$SCRIPT_DIR/.env"
            echo -e "  ${CHECK} Removed .env"
        else
            echo -e "  ${GRAY}Kept .env file${NC}"
        fi
    else
        echo -e "  ${GRAY}No .env file found${NC}"
    fi
}

remove_research_data() {
    print_section "Research Data"
    
    # Try to get research dir from .env
    local research_dir=""
    if [ -f "$SCRIPT_DIR/.env" ]; then
        research_dir=$(grep "^RESEARCH_DIR=" "$SCRIPT_DIR/.env" 2>/dev/null | cut -d'=' -f2)
    fi
    
    if [ -n "$research_dir" ] && [ -d "$research_dir" ]; then
        echo -e "  ${RED}${BOLD}WARNING:${NC} Found research data at: ${WHITE}$research_dir${NC}"
        echo -e "  ${GRAY}This contains your research projects and results${NC}"
        echo ""
        
        if ask_yes_no "DELETE all research data? (This cannot be undone!)" "n"; then
            rm -rf "$research_dir"
            echo -e "  ${CHECK} Deleted research data"
        else
            echo -e "  ${CHECK} Kept research data at $research_dir"
        fi
    else
        echo -e "  ${GRAY}No research data directory found${NC}"
    fi
}

show_summary() {
    print_section "Uninstall Complete"
    
    echo -e "  ${CHECK} Research Portal has been uninstalled"
    echo ""
    echo -e "  ${WHITE}To reinstall:${NC}"
    echo -e "    ${CYAN}./setup.sh${NC}"
    echo ""
}

# Main
main() {
    print_banner
    
    echo -e "  ${WHITE}This will remove the Research Portal Docker deployment.${NC}"
    echo ""
    
    if ! ask_yes_no "Continue with uninstall?" "n"; then
        echo ""
        echo -e "  ${GRAY}Uninstall cancelled${NC}"
        echo ""
        exit 0
    fi
    
    stop_containers
    remove_volumes
    remove_images
    remove_network
    remove_config
    remove_research_data
    show_summary
}

main "$@"
