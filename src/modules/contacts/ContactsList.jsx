import { Loader2, MoreHorizontal, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { navigate } from '../../router';

import CallButton from '../../components/CallButton';
import { getCompanies, getContacts } from '../../lib/api';

// Shadcn UI Imports
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Button } from '../../components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { Input } from '../../components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../components/ui/table';
import { useToast } from '../../components/ui/use-toast';

export default function ContactsList() {
  const { toast } = useToast();

  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // Refs
  const isMountedRef = useRef(false);
  const activeContactsRequestRef = useRef(null);

  useEffect(() => {
    isMountedRef.current = true;
    fetchContacts();
    fetchCompanies();
    return () => {
      isMountedRef.current = false;
      activeContactsRequestRef.current?.abort?.();
    };
  }, []);

  const fetchContacts = async (page = 1, search = '', size = 10) => {
    setLoading(true);
    activeContactsRequestRef.current?.abort?.();
    const abortController = new AbortController();
    activeContactsRequestRef.current = abortController;

    try {
      const response = await getContacts(
        { page, page_size: size, search: search || undefined },
        { signal: abortController.signal }
      );
      if (!isMountedRef.current) return;

      const results = response?.results || response || [];
      const total = response?.count || results.length;

      console.log('Contacts Loaded:', results.length);
      setContacts(results);
      setPagination((p) => ({ ...p, current: page, pageSize: size, total }));
    } catch (error) {
      if (error.name !== 'AbortError') console.error(error);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const data = await getCompanies({ page_size: 1000 });
      if (isMountedRef.current) setCompanies(data?.results || []);
    } catch (error) {
      console.error(error);
    }
  };

  // Logic
  const companyNameById = useMemo(() => {
    return companies.reduce((acc, company) => {
      acc[company.id] = company.full_name || company.name || '-';
      return acc;
    }, {});
  }, [companies]);

  const bulkSmsRecipients = contacts
    .filter((c) => selectedRowKeys.includes(c.id))
    .map((c) => ({
      id: c.id,
      name: c.full_name || `${c.first_name || ''} ${c.last_name || ''}`.trim(),
      phone: c.phone,
    }));

  // Handlers
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedRowKeys(contacts.map((c) => c.id));
    } else {
      setSelectedRowKeys([]);
    }
  };

  const handleSelectRow = (id, checked) => {
    if (checked) {
      setSelectedRowKeys((prev) => [...prev, id]);
    } else {
      setSelectedRowKeys((prev) => prev.filter((k) => k !== id));
    }
  };

  const handleDelete = async (ids) => {
    try {
      // Simulate delete
      toast({ title: 'Deleting...', description: `Deleting ${ids.length} contacts` });
      // await Promise.all(ids.map(id => deleteContact(id)));
      // fetchContacts(1, searchText, pagination.pageSize);
      // setSelectedRowKeys([]);
      toast({ title: 'Deleted', description: 'Contacts deleted successfully' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete contacts' });
    }
  };

  const allSelected = contacts.length > 0 && selectedRowKeys.length === contacts.length;

  return (
    <div className="space-y-4 p-4 md:p-8 pt-6">
      {/* Header Section */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Контакты</h2>
          <p className="text-muted-foreground">Управляйте контактами и их данными</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => fetchContacts()}>
            Обновить
          </Button>
          <Button onClick={() => navigate('/contacts/new')}>
            <Plus className="mr-2 h-4 w-4" /> Создать контакт
          </Button>
        </div>
      </div>

      {/* Toolbar Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1 space-x-2">
          <div className="relative w-full md:w-[300px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по имени, email..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  fetchContacts(1, searchText, pagination.pageSize);
                }
              }}
              className="pl-8"
              aria-label="Search"
            />
          </div>

          {selectedRowKeys.length > 0 && (
            <div className="flex items-center space-x-2 bg-muted/40 p-1.5 rounded-md border">
              <span className="text-sm px-2 font-medium text-muted-foreground">
                Выбрано: {selectedRowKeys.length}
              </span>
              <Button size="sm" variant="destructive" onClick={() => handleDelete(selectedRowKeys)}>
                <Trash2 className="mr-2 h-4 w-4" /> Удалить
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30px]">
                <Input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="h-4 w-4"
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Контакт</TableHead>
              <TableHead>Компания</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Телефон</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin inline" /> Загрузка...
                </TableCell>
              </TableRow>
            ) : contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Нет контактов
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact) => (
                <TableRow key={contact.id} className="group">
                  <TableCell>
                    <Input
                      type="checkbox"
                      checked={selectedRowKeys.includes(contact.id)}
                      onChange={(e) => handleSelectRow(contact.id, e.target.checked)}
                      className="h-4 w-4"
                      aria-label={`Select contact ${contact.id}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage
                          src={`https://ui-avatars.com/api/?name=${contact.first_name}+${contact.last_name}`}
                          alt={contact.first_name}
                        />
                        <AvatarFallback>
                          {(contact.first_name?.[0] || '') + (contact.last_name?.[0] || '')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="font-medium">
                        <div>
                          {contact.first_name} {contact.last_name}
                        </div>
                        <div className="text-xs text-muted-foreground">{contact.title}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {/* Render basic company string safest way */}
                    {contact.company && typeof contact.company === 'object'
                      ? contact.company.name || companyNameById[contact.company.id] || 'N/A'
                      : companyNameById[contact.company] || 'N/A'}
                  </TableCell>
                  <TableCell>{contact.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{contact.phone}</span>
                      <CallButton phone={contact.phone} name={contact.first_name} />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Действия</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => navigate(`/contacts/${contact.id}`)}>
                          Просмотр
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/contacts/${contact.id}/edit`)}>
                          Редактировать
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete([contact.id])}
                          className="text-red-600"
                        >
                          Удалить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Строк: {pagination.total} (Стр. {pagination.current})
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchContacts(pagination.current - 1, searchText, pagination.pageSize)}
            disabled={pagination.current <= 1 || loading}
          >
            Назад
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchContacts(pagination.current + 1, searchText, pagination.pageSize)}
            disabled={contacts.length < pagination.pageSize || loading}
          >
            Вперед
          </Button>
        </div>
      </div>
    </div>
  );
}
