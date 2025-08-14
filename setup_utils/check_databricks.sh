#!/bin/bash

# Check and install Databricks CLI

source "$(dirname "${BASH_SOURCE[0]}")/utils.sh"

check_databricks() {
    local OS=$(get_os)
    
    if ! install_dependency "Databricks CLI" "databricks" "
        case '$OS' in
            'macOS')
                brew tap databricks/tap && brew install databricks
                ;;
            'Linux')
                curl -fsSL https://raw.githubusercontent.com/databricks/setup-cli/main/install.sh | sh
                ;;
            'Windows')
                echo 'Please install Databricks CLI manually on Windows:'
                echo 'https://docs.databricks.com/en/dev-tools/cli/install.html'
                return 1
                ;;
            *)
                echo 'Installing via pip...'
                pip install databricks-cli
                ;;
        esac
    "; then
        echo "Please install Databricks CLI and re-run this setup script."
        echo "Visit: https://docs.databricks.com/en/dev-tools/cli/install.html"
        return 1
    fi
    
    return 0
}

# Run the check if this script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    check_databricks
fi