#!/bin/bash
# Script to package the application for delivery to a customer

PACKAGE_NAME="mystery-games-framework-bundle.zip"
TMP_DIR="pkg_tmp"

echo "📦 Packaging Mystery Games Framework..."

# Clean up any old package
rm -f $PACKAGE_NAME
rm -rf $TMP_DIR

# Create temp directory
mkdir -p $TMP_DIR

# Copy necessary files and directories
echo "📂 Copying files..."
cp -r src $TMP_DIR/
cp -r public $TMP_DIR/
cp -r terraform $TMP_DIR/
cp package.json package-lock.json vite.config.js tailwind.config.js postcss.config.js index.html $TMP_DIR/
cp Dockerfile nginx.conf cloudbuild.yaml deploy.sh .gcloudignore $TMP_DIR/
cp .env.example $TMP_DIR/
cp CUSTOMER_DEPLOY_GUIDE.md README.md $TMP_DIR/

# Create the zip file
echo "🤐 Zipping..."
cd $TMP_DIR
zip -r ../$PACKAGE_NAME . -x "**/node_modules/*" "**/.git/*" "**/.DS_Store"
cd ..

# Clean up
rm -rf $TMP_DIR

echo "=================================================="
echo "✅ Packaging Complete!"
echo "📦 Package: $PACKAGE_NAME"
echo "📄 Next Steps: Send this zip file to the customer and have them follow CUSTOMER_DEPLOY_GUIDE.md"
echo "=================================================="
