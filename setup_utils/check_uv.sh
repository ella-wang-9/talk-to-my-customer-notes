#!/bin/bash

# Check and install uv Python package manager

source "$(dirname "${BASH_SOURCE[0]}")/utils.sh"

check_uv() {
    local OS=$(get_os)
    
    if ! install_dependency "uv (Python package manager)" "uv" "
        case '$OS' in
            'Windows')
                powershell -ExecutionPolicy ByPass -c 'irm https://astral.sh/uv/install.ps1 | iex'
                ;;
            *)
                curl -LsSf https://astral.sh/uv/install.sh | sh
                # Source the shell configuration to update PATH
                if [ -f \"\$HOME/.local/bin/env\" ]; then
                    source \"\$HOME/.local/bin/env\"
                fi
                # Add to PATH for current session
                export PATH=\"\$HOME/.local/bin:\$PATH\"
                ;;
        esac
    "; then
        echo "Please install uv and re-run this setup script."
        echo "Visit: https://docs.astral.sh/uv/getting-started/installation/"
        return 1
    fi
    
    return 0
}

# Run the check if this script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    check_uv
fi