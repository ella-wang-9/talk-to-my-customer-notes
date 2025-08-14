#!/bin/bash

# Shared utilities for setup scripts

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to get OS type
get_os() {
    case "$(uname -s)" in
        Darwin*) echo "macOS" ;;
        Linux*) echo "Linux" ;;
        CYGWIN*|MINGW*|MSYS*) echo "Windows" ;;
        *) echo "Unknown" ;;
    esac
}

# Function to install a dependency with user confirmation
install_dependency() {
    local dep_name="$1"
    local check_command="$2"
    local install_commands="$3"
    
    if command_exists "$check_command"; then
        echo "✅ $dep_name is already installed"
        if [ "$dep_name" = "Python" ]; then
            local version
            if command_exists python3; then
                version=$(python3 --version 2>&1)
            elif command_exists python; then
                version=$(python --version 2>&1)
            fi
            echo "   Version: $version"
        elif [ "$check_command" != "python" ] && [ "$check_command" != "python3" ]; then
            local version=$($check_command --version 2>&1 | head -n1)
            echo "   Version: $version"
        fi
        return 0
    fi
    
    echo ""
    echo "❌ $dep_name is not installed"
    echo "📋 $dep_name is required for this project to work properly."
    echo ""
    read -p "🤔 Would you like me to install $dep_name for you? (y/N): " install_choice
    
    if [[ "$install_choice" =~ ^[Yy]$ ]]; then
        echo "🚀 Installing $dep_name..."
        eval "$install_commands"
        
        # Verify installation
        if command_exists "$check_command"; then
            echo "✅ $dep_name installed successfully!"
            if [ "$dep_name" != "Python" ] && [ "$check_command" != "python" ] && [ "$check_command" != "python3" ]; then
                local version=$($check_command --version 2>&1 | head -n1)
                echo "   Version: $version"
            fi
        else
            echo "❌ Failed to install $dep_name. Please install it manually."
            echo "   Visit the installation guide for more details."
            return 1
        fi
    else
        echo "⚠️  Skipping $dep_name installation."
        echo "   You can install it later manually or re-run this setup script."
        echo ""
        return 1
    fi
}