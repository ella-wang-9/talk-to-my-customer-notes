#!/bin/bash

# Check and install Homebrew (macOS only)

source "$(dirname "${BASH_SOURCE[0]}")/utils.sh"

check_homebrew() {
    local OS=$(get_os)
    
    # Only check Homebrew on macOS
    if [ "$OS" != "macOS" ]; then
        return 0
    fi
    
    if ! install_dependency "Homebrew (package manager)" "brew" "
        echo 'Installing Homebrew...'
        /bin/bash -c '\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)'
        
        # Add Homebrew to PATH for current session
        if [[ \$(uname -m) == 'arm64' ]]; then
            # Apple Silicon Mac
            eval '/opt/homebrew/bin/brew shellenv'
        else
            # Intel Mac
            eval '/usr/local/bin/brew shellenv'
        fi
    "; then
        echo "Please install Homebrew manually and re-run this setup script."
        echo "Visit: https://brew.sh/"
        return 1
    fi
    
    return 0
}

# Run the check if this script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    check_homebrew
fi