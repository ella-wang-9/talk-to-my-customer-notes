#!/bin/bash

# Check and install Node.js 18+

source "$(dirname "${BASH_SOURCE[0]}")/utils.sh"

check_node() {
    local OS=$(get_os)
    
    if ! install_dependency "Node.js 18+" "node" "
        case '$OS' in
            'macOS')
                if command_exists brew; then
                    brew install node
                else
                    echo 'Please install Homebrew first or download from: https://nodejs.org/'
                fi
                ;;
            'Linux')
                if command_exists apt-get; then
                    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
                    sudo apt-get install -y nodejs
                elif command_exists yum; then
                    curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
                    sudo yum install -y nodejs
                elif command_exists dnf; then
                    curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
                    sudo dnf install -y nodejs
                else
                    echo 'Please install Node.js manually from: https://nodejs.org/'
                fi
                ;;
            'Windows')
                echo 'Please download and install Node.js from: https://nodejs.org/'
                echo 'Or use: winget install OpenJS.NodeJS'
                ;;
            *)
                echo 'Please install Node.js manually from: https://nodejs.org/'
                ;;
        esac
    "; then
        echo "Please install Node.js 18+ and re-run this setup script."
        echo "Visit: https://nodejs.org/"
        return 1
    fi

    # Verify Node.js version
    if command_exists node; then
        node_version=$(node --version 2>&1 | grep -oE '[0-9]+\.[0-9]+' | head -n1)
        major_version=$(echo "$node_version" | cut -d. -f1)
        
        if [ "$major_version" -lt 18 ]; then
            echo "⚠️  Warning: Node.js version $node_version detected, but 18+ is recommended"
        fi
    fi
    
    return 0
}

# Run the check if this script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    check_node
fi