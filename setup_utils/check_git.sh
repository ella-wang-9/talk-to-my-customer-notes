#!/bin/bash

# Check and install Git

source "$(dirname "${BASH_SOURCE[0]}")/utils.sh"

check_git() {
    local OS=$(get_os)
    
    if ! install_dependency "Git" "git" "
        case '$OS' in
            'macOS')
                echo 'Installing Git via Xcode Command Line Tools...'
                xcode-select --install
                ;;
            'Linux')
                if command_exists apt-get; then
                    sudo apt-get update && sudo apt-get install -y git
                elif command_exists yum; then
                    sudo yum install -y git
                elif command_exists dnf; then
                    sudo dnf install -y git
                elif command_exists pacman; then
                    sudo pacman -S git
                else
                    echo 'Please install Git manually for your Linux distribution'
                    echo 'Visit: https://git-scm.com/download/linux'
                fi
                ;;
            'Windows')
                echo 'Please download and install Git from: https://git-scm.com/download/win'
                echo 'Or use: winget install Git.Git'
                ;;
            *)
                echo 'Please install Git manually from: https://git-scm.com/'
                ;;
        esac
    "; then
        echo "Please install Git and re-run this setup script."
        return 1
    fi
    
    return 0
}

# Run the check if this script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    check_git
fi