#!/bin/bash

# Migration Script: Ant Design Icons → lucide-react
# Usage: ./migrate-icons.sh <file_or_directory>
# Example: ./migrate-icons.sh src/modules/leads/

set -e

TARGET="${1:-.}"

echo "🔄 Starting icon migration for: $TARGET"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Backup
echo "📦 Creating backup..."
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
if [ -d "$TARGET" ]; then
  cp -r "$TARGET" "$BACKUP_DIR/"
elif [ -f "$TARGET" ]; then
  cp "$TARGET" "$BACKUP_DIR/"
fi
echo "✅ Backup created in: $BACKUP_DIR"

# Function to replace icons in a file
migrate_file() {
  local file="$1"
  echo "  Processing: $file"
  
  # Skip if not a JS/JSX file
  if [[ ! "$file" =~ \.(js|jsx|ts|tsx)$ ]]; then
    return
  fi
  
  # Create temp file
  temp_file=$(mktemp)
  
  # Replace import statement
  sed -E "s/import \{ ([^}]+) \} from '@ant-design\/icons';/import { \1 } from 'lucide-react';/" "$file" > "$temp_file"
  
  # Common icon replacements
  sed -i.bak -E '
    # Save/Storage icons
    s/SaveOutlined/Save/g
    s/SaveFilled/Save/g
    
    # Edit icons
    s/EditOutlined/Edit/g
    s/EditFilled/Edit/g
    s/FormOutlined/Edit/g
    
    # Delete icons
    s/DeleteOutlined/Trash2/g
    s/DeleteFilled/Trash2/g
    
    # Add/Plus icons
    s/PlusOutlined/Plus/g
    s/PlusCircleOutlined/PlusCircle/g
    s/PlusSquareOutlined/PlusSquare/g
    
    # Close icons
    s/CloseOutlined/X/g
    s/CloseCircleOutlined/XCircle/g
    s/CloseSquareOutlined/XSquare/g
    
    # Search icons
    s/SearchOutlined/Search/g
    
    # Filter icons
    s/FilterOutlined/Filter/g
    s/FilterFilled/Filter/g
    
    # Check/Confirm icons
    s/CheckOutlined/Check/g
    s/CheckCircleOutlined/CheckCircle/g
    s/CheckSquareOutlined/CheckSquare/g
    
    # Info icons
    s/InfoCircleOutlined/Info/g
    s/InfoOutlined/Info/g
    
    # Warning icons
    s/WarningOutlined/AlertTriangle/g
    s/WarningFilled/AlertTriangle/g
    s/ExclamationCircleOutlined/AlertCircle/g
    s/ExclamationOutlined/AlertTriangle/g
    
    # Navigation icons
    s/ArrowLeftOutlined/ArrowLeft/g
    s/ArrowRightOutlined/ArrowRight/g
    s/ArrowUpOutlined/ArrowUp/g
    s/ArrowDownOutlined/ArrowDown/g
    s/LeftOutlined/ChevronLeft/g
    s/RightOutlined/ChevronRight/g
    s/UpOutlined/ChevronUp/g
    s/DownOutlined/ChevronDown/g
    s/DoubleLeftOutlined/ChevronsLeft/g
    s/DoubleRightOutlined/ChevronsRight/g
    
    # Loading/Refresh icons
    s/LoadingOutlined/Loader2/g
    s/Loading3QuartersOutlined/Loader2/g
    s/SyncOutlined/RefreshCw/g
    s/ReloadOutlined/RotateCw/g
    
    # Eye icons
    s/EyeOutlined/Eye/g
    s/EyeInvisibleOutlined/EyeOff/g
    
    # Communication icons
    s/PhoneOutlined/Phone/g
    s/MailOutlined/Mail/g
    s/MessageOutlined/MessageSquare/g
    s/SendOutlined/Send/g
    s/BellOutlined/Bell/g
    
    # User icons
    s/UserOutlined/User/g
    s/UserAddOutlined/UserPlus/g
    s/UserDeleteOutlined/UserMinus/g
    s/UsergroupAddOutlined/Users/g
    s/TeamOutlined/Users/g
    
    # Settings icons
    s/SettingOutlined/Settings/g
    s/SettingFilled/Settings/g
    
    # File icons
    s/FileOutlined/File/g
    s/FileTextOutlined/FileText/g
    s/FilePdfOutlined/FileText/g
    s/FileExcelOutlined/FileSpreadsheet/g
    s/FileWordOutlined/FileText/g
    s/FileImageOutlined/Image/g
    s/FolderOutlined/Folder/g
    s/FolderOpenOutlined/FolderOpen/g
    
    # Upload/Download icons
    s/UploadOutlined/Upload/g
    s/DownloadOutlined/Download/g
    s/CloudUploadOutlined/CloudUpload/g
    s/CloudDownloadOutlined/CloudDownload/g
    s/InboxOutlined/Inbox/g
    
    # Business icons
    s/ShopOutlined/Store/g
    s/ShoppingOutlined/ShoppingCart/g
    s/ShoppingCartOutlined/ShoppingCart/g
    s/DollarOutlined/DollarSign/g
    s/DollarCircleOutlined/DollarSign/g
    
    # Calendar/Time icons
    s/CalendarOutlined/Calendar/g
    s/ClockCircleOutlined/Clock/g
    
    # Dashboard/Chart icons
    s/DashboardOutlined/LayoutDashboard/g
    s/BarChartOutlined/BarChart3/g
    s/LineChartOutlined/LineChart/g
    s/PieChartOutlined/PieChart/g
    s/AreaChartOutlined/AreaChart/g
    
    # Global/Language icons
    s/GlobalOutlined/Globe/g
    
    # Lock icons
    s/LockOutlined/Lock/g
    s/UnlockOutlined/Unlock/g
    
    # Star icons
    s/StarOutlined/Star/g
    s/StarFilled/Star/g
    
    # Heart icons
    s/HeartOutlined/Heart/g
    s/HeartFilled/Heart/g
    
    # Tag icons
    s/TagOutlined/Tag/g
    s/TagsOutlined/Tags/g
    
    # Link icons
    s/LinkOutlined/Link/g
    
    # Share icons
    s/ShareAltOutlined/Share2/g
    
    # Copy icons
    s/CopyOutlined/Copy/g
    
    # Camera icons
    s/CameraOutlined/Camera/g
    
    # Video icons
    s/VideoCameraOutlined/Video/g
    
    # Picture icons
    s/PictureOutlined/Image/g
    
    # Print icons
    s/PrinterOutlined/Printer/g
    
    # QR/Barcode icons
    s/QrcodeOutlined/QrCode/g
    s/ScanOutlined/ScanLine/g
    
    # Menu icons
    s/MenuOutlined/Menu/g
    s/MenuFoldOutlined/PanelLeftClose/g
    s/MenuUnfoldOutlined/PanelLeftOpen/g
    
    # Social media icons
    s/FacebookOutlined/Facebook/g
    s/InstagramOutlined/Instagram/g
    
    # Rocket icon
    s/RocketOutlined/Rocket/g
    
    # Database icon
    s/DatabaseOutlined/Database/g
    
    # Cloud icon
    s/CloudOutlined/Cloud/g
    
    # Wifi icon
    s/WifiOutlined/Wifi/g
    
    # API icon
    s/ApiOutlined/Webhook/g
    
    # Export/Import icons
    s/ExportOutlined/FileDown/g
    s/ImportOutlined/FileUp/g
  ' "$temp_file"
  
  # Move temp file back
  mv "$temp_file" "$file"
  rm -f "${file}.bak"
}

# Process files
if [ -d "$TARGET" ]; then
  echo "📁 Scanning directory..."
  find "$TARGET" -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) | while read -r file; do
    migrate_file "$file"
  done
elif [ -f "$TARGET" ]; then
  echo "📄 Processing single file..."
  migrate_file "$TARGET"
else
  echo "❌ Error: Target not found: $TARGET"
  exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Icon migration complete!"
echo ""
echo "⚠️  IMPORTANT: Manual review required!"
echo ""
echo "Next steps:"
echo "1. Review changes with: git diff"
echo "2. Check for unmapped icons (search for 'Outlined' or 'Filled')"
echo "3. Update icon sizes: style={{ fontSize: '16px' }} → size={16}"
echo "4. Add className for colors: style={{ color: '#000' }} → className=\"text-black\""
echo "5. For loading icons, add: className=\"animate-spin\""
echo "6. Test the application thoroughly"
echo ""
echo "🔍 Find remaining Ant Design icons:"
echo "   grep -r 'Outlined\\|Filled' $TARGET --include='*.jsx' --include='*.js'"
echo ""
echo "📦 Backup location: $BACKUP_DIR"
echo ""
echo "📚 Reference:"
echo "   - Icon mapping: SHADCN_MIGRATION_GUIDE.md"
echo "   - Quick reference: SHADCN_QUICK_REFERENCE.md"

