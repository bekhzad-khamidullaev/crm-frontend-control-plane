/**
 * BulkActions Component
 * Universal bulk actions component for tables with selection
 */

import React from 'react';
import { Check, Edit, FileDown, Mail, MessageSquare, MoreHorizontal, Tags, Trash } from 'lucide-react';

import { Button } from './ui/button.jsx';
import { Badge } from './ui/badge.jsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu.jsx';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog.jsx';
import { toast } from './ui/use-toast.js';

export default function BulkActions({
  selectedRowKeys = [],
  onClearSelection,
  onDelete,
  onStatusChange,
  onExport,
  onSendEmail,
  onSendSMS,
  onBulkTag,
  customActions = [],
  entityName = 'записей',
}) {
  const count = selectedRowKeys.length;
  const [open, setOpen] = React.useState(false);

  if (count === 0) {
    return null;
  }

  const handleDelete = async () => {
    try {
      await onDelete(selectedRowKeys);
      toast({ title: 'Удалено', description: `Удалено ${count} ${entityName}` });
      onClearSelection();
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Ошибка удаления', variant: 'destructive' });
    } finally {
      setOpen(false);
    }
  };

  const menuItems = [
    onStatusChange && {
      key: 'status',
      icon: <Edit className="mr-2 h-4 w-4" />,
      label: 'Изменить статус',
      onClick: () => onStatusChange(selectedRowKeys),
    },
    onExport && {
      key: 'export',
      icon: <FileDown className="mr-2 h-4 w-4" />,
      label: 'Экспортировать',
      onClick: () => onExport(selectedRowKeys),
    },
    onSendEmail && {
      key: 'email',
      icon: <Mail className="mr-2 h-4 w-4" />,
      label: 'Отправить Email',
      onClick: () => onSendEmail(selectedRowKeys),
    },
    onSendSMS && {
      key: 'sms',
      icon: <MessageSquare className="mr-2 h-4 w-4" />,
      label: 'Отправить SMS',
      onClick: () => onSendSMS(selectedRowKeys),
    },
    onBulkTag && {
      key: 'tags',
      icon: <Tags className="mr-2 h-4 w-4" />,
      label: 'Добавить теги',
      onClick: () => onBulkTag(selectedRowKeys),
    },
    ...customActions.map((action) => ({
      key: action.key,
      icon: action.icon,
      label: action.label,
      onClick: () => action.onClick(selectedRowKeys),
    })),
  ].filter(Boolean);

  return (
    <div className="fixed bottom-6 left-1/2 z-50 w-full max-w-xl -translate-x-1/2 rounded-lg border border-border bg-background px-4 py-3 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{count}</Badge>
          <span className="text-sm font-medium">Выбрано: {count} {entityName}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={onClearSelection}>
            Отменить
          </Button>

          {onDelete && (
            <Button size="sm" variant="destructive" onClick={() => setOpen(true)}>
              <Trash className="mr-2 h-4 w-4" />
              Удалить
            </Button>
          )}

          {menuItems.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  <MoreHorizontal className="mr-2 h-4 w-4" />
                  Действия
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {menuItems.map((item) => (
                  <DropdownMenuItem key={item.key} onClick={item.onClick}>
                    {item.icon}
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить {count} {entityName}?</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Удалить
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

