#!/bin/bash
# Backup script for CRM Frontend configurations

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="crm-frontend-backup-$TIMESTAMP"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📦 Creating backup...${NC}"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create temporary directory for backup
TEMP_DIR=$(mktemp -d)
BACKUP_PATH="$TEMP_DIR/$BACKUP_NAME"
mkdir -p "$BACKUP_PATH"

# Backup configuration files
echo "Backing up configuration files..."
cp .env.production "$BACKUP_PATH/" 2>/dev/null || true
cp .env.staging "$BACKUP_PATH/" 2>/dev/null || true
cp docker-compose.yml "$BACKUP_PATH/"
cp nginx.conf "$BACKUP_PATH/"
cp Dockerfile "$BACKUP_PATH/"

# Backup nginx logs
if [ -d "./logs/nginx" ]; then
    echo "Backing up nginx logs..."
    mkdir -p "$BACKUP_PATH/logs"
    cp -r ./logs/nginx "$BACKUP_PATH/logs/" 2>/dev/null || true
fi

# Create archive
echo "Creating archive..."
cd "$TEMP_DIR"
tar -czf "$BACKUP_NAME.tar.gz" "$BACKUP_NAME"

# Move to backup directory
mv "$BACKUP_NAME.tar.gz" "$BACKUP_DIR/"

# Cleanup
rm -rf "$TEMP_DIR"

echo -e "${GREEN}✅ Backup created: $BACKUP_DIR/$BACKUP_NAME.tar.gz${NC}"

# Remove old backups (keep last 10)
echo "Cleaning up old backups..."
cd "$BACKUP_DIR"
ls -t crm-frontend-backup-*.tar.gz | tail -n +11 | xargs rm -f 2>/dev/null || true

echo -e "${GREEN}✅ Backup complete!${NC}"
