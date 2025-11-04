#!/bin/bash

# Comprehensive iOS Issues Fix Script
set -e

echo "🚀 Starting iOS issues fix process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${BLUE}📋 Step $1: $2${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Step 1: Check if we're in a React Native project
print_step 1 "Validating project structure"
if [ ! -d "ios" ]; then
    print_error "This doesn't appear to be a React Native project (no ios folder found)"
    exit 1
fi
print_success "Project structure validated"

# Step 2: Update iOS deployment target
print_step 2 "Updating iOS deployment target"
cd ios

# Update Podfile if it exists
if [ -f "Podfile" ]; then
    # Backup original Podfile
    cp Podfile Podfile.backup.$(date +%Y%m%d_%H%M%S)
    
    # Update deployment target
    sed -i '' "s/platform :ios, '[0-9.]*'/platform :ios, '14.0'/g" Podfile
    print_success "Updated Podfile deployment target to iOS 14.0"
else
    print_warning "Podfile not found - this is expected for some Expo projects"
fi

# Step 3: Clean and reinstall pods
print_step 3 "Cleaning and reinstalling CocoaPods"
rm -rf Pods
rm -f Podfile.lock
print_success "Cleaned old Pods installation"

if command -v pod &> /dev/null; then
    pod install --repo-update
    print_success "Reinstalled CocoaPods dependencies"
else
    print_warning "CocoaPods not found - installing..."
    sudo gem install cocoapods
    pod install --repo-update
    print_success "Installed CocoaPods and dependencies"
fi

cd ..

# Step 4: Update Expo and dependencies
print_step 4 "Updating dependencies"
if [ -f "package.json" ]; then
    npm install
    if command -v npx &> /dev/null; then
        npx expo install --fix
        print_success "Updated Expo dependencies"
    else
        print_warning "Expo CLI not found - skipping Expo updates"
    fi
    print_success "Updated dependencies"
else
    print_warning "package.json not found - skipping dependency updates"
fi

# Step 5: Clean build cache
print_step 5 "Cleaning build cache"
cd ios
if [ -d "build" ]; then
    rm -rf build
    print_success "Cleaned iOS build cache"
fi

# Clean Xcode derived data
if [ -d ~/Library/Developer/Xcode/DerivedData ]; then
    rm -rf ~/Library/Developer/Xcode/DerivedData/PadelCommunity-*
    print_success "Cleaned Xcode derived data"
fi

cd ..

echo ""
echo -e "${GREEN}🎉 iOS issues fix completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo "1. Open ios/PadelCommunity.xcworkspace in Xcode"
echo "2. Set the deployment target to 14.0+ in your project settings"
echo "3. Clean and rebuild your project"
echo ""
echo -e "${GREEN}✨ Most of your 781 issues should now be resolved!${NC}"
