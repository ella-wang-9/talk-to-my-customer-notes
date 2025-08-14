#!/bin/bash

# Check and install Bun JavaScript package manager

source "$(dirname "${BASH_SOURCE[0]}")/utils.sh"

check_bun() {
    local OS=$(get_os)
    
    if ! install_dependency "Bun (JavaScript package manager)" "bun" "
        case '$OS' in
            'Windows')
                powershell -c 'irm bun.com/install.ps1 | iex'
                ;;
            'macOS')
                if command_exists brew; then
                    brew tap oven-sh/bun && brew install bun
                else
                    curl -fsSL https://bun.sh/install | bash
                    # Source shell configuration
                    if [ -f \"\$HOME/.bashrc\" ]; then
                        source \"\$HOME/.bashrc\"
                    elif [ -f \"\$HOME/.zshrc\" ]; then
                        source \"\$HOME/.zshrc\"
                    fi
                fi
                ;;
            *)
                curl -fsSL https://bun.sh/install | bash
                # Source shell configuration
                if [ -f \"\$HOME/.bashrc\" ]; then
                    source \"\$HOME/.bashrc\"
                elif [ -f \"\$HOME/.zshrc\" ]; then
                    source \"\$HOME/.zshrc\"
                fi
                ;;
        esac
    "; then
        echo "Please install Bun and re-run this setup script."
        echo "Visit: https://bun.sh/docs/installation"
        return 1
    fi
    
    return 0
}

# Run the check if this script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    check_bun
fi