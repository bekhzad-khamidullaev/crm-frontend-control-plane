import dayjs from 'dayjs';
import {
    ArrowLeft,
    Briefcase,
    Building2,
    CheckCircle2,
    Edit,
    Globe,
    History,
    Mail,
    MapPin,
    MessageSquare,
    MoreHorizontal,
    Phone,
    StickyNote,
    Tag,
    Trash2,
    User,
    XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';

// Logic / API
import { getEntityCallLogs } from '../../lib/api/calls';
import { deleteLead, getLead, getUser, getUsers, leadsApi } from '../../lib/api/client';
import { buildLeadPayload, deriveLeadStatus, getLeadSourceLabel } from '../../lib/utils/leads';
import { navigate } from '../../router';

// Components
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "../../components/ui/alert-dialog";
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../../components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Label } from '../../components/ui/label';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Separator } from '../../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { toast } from '../../components/ui/use-toast';

// Custom / Domain Components
import CallButton from '../../components/CallButton';
import AIAssistantPanel from '../../components/AIAssistantPanel.jsx';
import EntitySelect from '../../components/EntitySelect.jsx';
import ChatWidget from '../../modules/chat/ChatWidget';

function LeadDetail({ id }) {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [callLogs, setCallLogs] = useState([]);
  const [callLogsLoading, setCallLogsLoading] = useState(false);

  // Modal States
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState(null);

  // Status & Confirmation States
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [disqualifyDialogOpen, setDisqualifyDialogOpen] = useState(false);

  useEffect(() => {
    loadLead();
  }, [id]);

  useEffect(() => {
    if (lead) {
      loadCallLogs();
      setSelectedOwner(lead.owner || null);
    }
  }, [lead?.phone, lead?.id]);

  const loadLead = async () => {
    setLoading(true);
    try {
      const data = await getLead(id);
      setLead(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось загрузить данные лида",
      });
      console.error('Error loading lead:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCallLogs = async () => {
    setCallLogsLoading(true);
    try {
      const search = lead?.phone || lead?.phone_number;
      const response = await getEntityCallLogs('lead', id, search ? { search } : {});
      setCallLogs(response.results || []);
    } catch (error) {
      console.error('Error loading call logs:', error);
      setCallLogs([]);
    } finally {
      setCallLogsLoading(false);
    }
  };

  // --- Actions ---

  const handleDelete = async () => {
    try {
      await deleteLead(id);
      toast({
        title: "Лид удален",
        description: "Лид был успешно удален из системы",
      });
      navigate('/leads');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось удалить лид",
      });
    }
  };

  const handleAssign = async () => {
    if (!selectedOwner) {
       toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Выберите ответственного",
      });
      return;
    }

    try {
      setAssigning(true);
      await leadsApi.assign(id, { owner: selectedOwner });
      toast({
        title: "Успешно",
        description: "Ответственный назначен",
      });
      setAssignModalOpen(false);
      loadLead();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось назначить ответственного",
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleConvert = async () => {
    try {
      if (deriveLeadStatus(lead) === 'converted') {
        toast({ title: "Внимание", description: "Этот лид уже конвертирован" });
        return;
      }

      const leadData = buildLeadPayload(lead);
      await leadsApi.convert(id, leadData);

      toast({
        title: "Конвертация успешна",
        description: "Лид конвертирован в сделку",
      });
      setConvertDialogOpen(false);
      loadLead();
    } catch (error) {
      console.error('Convert error:', error);
      toast({
        variant: "destructive",
        title: "Ошибка конвертации",
        description: error?.response?.data?.detail || "Произошла ошибка при конвертации",
      });
    }
  };

  const handleDisqualify = async () => {
    try {
      if (deriveLeadStatus(lead) === 'lost') {
        toast({ title: "Внимание", description: "Этот лид уже дисквалифицирован" });
        return;
      }

      const leadData = buildLeadPayload(lead);
      await leadsApi.disqualify(id, leadData);

      toast({
        title: "Дисквалифицировано",
        description: "Лид помечен как потерянный",
      });
      setDisqualifyDialogOpen(false);
      loadLead();
    } catch (error) {
       console.error('Disqualify error:', error);
        toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось дисквалифицировать лид",
      });
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // --- Helpers ---

  const getStatusBadge = (status) => {
    const config = {
      new: { label: 'Новый', className: 'bg-blue-100 text-blue-700 hover:bg-blue-100/80 border-blue-200' },
      converted: { label: 'Конвертирован', className: 'bg-teal-100 text-teal-700 hover:bg-teal-100/80 border-teal-200' },
      lost: { label: 'Потерян', className: 'bg-red-100 text-red-700 hover:bg-red-100/80 border-red-200' },
    };
    const style = config[status] || config.new;
    return <Badge variant="outline" className={`px-2 py-0.5 text-sm font-medium border ${style.className}`}>{style.label}</Badge>;
  };

  const getInitials = (first, last) => {
    return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase() || 'L';
  };

  const InfoRow = ({ icon: Icon, label, value, href }) => {
     if (!value) return null;
     return (
       <div className="flex items-start py-2 group">
         <Icon className="h-4 w-4 text-muted-foreground mt-1 mr-3 shrink-0" />
         <div className="flex-1 min-w-0">
           <p className="text-sm font-medium text-muted-foreground mb-0.5">{label}</p>
           {href ? (
             <a href={href} className="text-sm text-foreground hover:text-primary transition-colors truncate block">
               {value}
             </a>
           ) : (
             <p className="text-sm text-foreground break-words">{value}</p>
           )}
         </div>
       </div>
     );
  };


  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!lead) return <div className="p-8 text-center text-muted-foreground">Лид не найден</div>;

  const leadStatus = deriveLeadStatus(lead);
  const fullName = `${lead.first_name} ${lead.last_name}`;
  const sourceLabel = getLeadSourceLabel(lead);

  return (
    <div className="container mx-auto py-6 max-w-7xl animate-in fade-in duration-500">

      {/* Top Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground" onClick={() => navigate('/leads')}>
              <ArrowLeft className="h-4 w-4" />
              Назад
            </Button>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
            <CallButton
                phone={lead.phone}
                name={fullName}
                entityType="lead"
                entityId={lead.id}
                type="default"
                variant="outline"
                className="h-9"
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  Действия <MoreHorizontal className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Управление лидом</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(`/leads/${id}/edit`)}>
                  <Edit className="mr-2 h-4 w-4" /> Редактировать
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAssignModalOpen(true)}>
                  <User className="mr-2 h-4 w-4" /> Назначить
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={leadStatus === 'converted'}
                  onClick={() => setConvertDialogOpen(true)}
                  className="text-teal-600 focus:text-teal-700"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Конвертировать
                </DropdownMenuItem>
                 <DropdownMenuItem
                  disabled={leadStatus === 'lost' || leadStatus === 'converted'}
                  onClick={() => setDisqualifyDialogOpen(true)}
                  className="text-orange-600 focus:text-orange-700"
                >
                  <XCircle className="mr-2 h-4 w-4" /> Дисквалифицировать
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                   onClick={() => setDeleteDialogOpen(true)}
                   className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {leadStatus !== 'converted' && leadStatus !== 'lost' && (
              <Button size="sm" className="h-9" onClick={() => setConvertDialogOpen(true)}>
                Конвертировать
              </Button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: Sidebar (Info) */}
        <div className="lg:col-span-4 space-y-6">

          {/* Identity Card */}
          <Card className="overflow-hidden border-t-4 border-t-primary shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="text-center pb-2">
               <div className="mx-auto mb-4 relative">
                  <Avatar className="h-24 w-24 mx-auto border-4 border-background shadow-lg">
                    <AvatarFallback className="text-2xl font-semibold bg-primary/10 text-primary">
                      {getInitials(lead.first_name, lead.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-0 right-1/2 translate-x-10 translate-y-1">
                     {getStatusBadge(leadStatus)}
                  </div>
               </div>
               <CardTitle className="text-2xl font-bold text-foreground">{fullName}</CardTitle>
               <CardDescription className="text-base font-medium text-primary mt-1">
                  {lead.title || 'Должность не указана'}
               </CardDescription>
               <div className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                  <Building2 className="h-3 w-3" />
                  {lead.company_name || 'Компания не указана'}
               </div>
            </CardHeader>
            <CardContent>
               <div className="flex justify-center gap-4 py-4">
                  {lead.phone && (
                     <Button variant="outline" size="icon" className="rounded-full h-10 w-10 hover:border-primary hover:text-primary" onClick={() => window.location.href = `tel:${lead.phone}`} title="Позвонить">
                        <Phone className="h-4 w-4" />
                     </Button>
                  )}
                  {lead.email && (
                     <Button variant="outline" size="icon" className="rounded-full h-10 w-10 hover:border-primary hover:text-primary" onClick={() => window.location.href = `mailto:${lead.email}`} title="Написать">
                        <Mail className="h-4 w-4" />
                     </Button>
                  )}
               </div>
            </CardContent>
          </Card>

          {/* Contact Details */}
          <Card className="shadow-sm">
             <CardHeader className="pb-3">
               <CardTitle className="text-lg flex items-center gap-2">
                 <Briefcase className="h-5 w-5 text-primary" /> Контактные данные
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-1">
               <InfoRow icon={Phone} label="Телефон" value={lead.phone} href={`tel:${lead.phone}`} />
               <InfoRow icon={Phone} label="Доп. телефон" value={lead.other_phone} href={`tel:${lead.other_phone}`} />
               <InfoRow icon={Mail} label="Email" value={lead.email} href={`mailto:${lead.email}`} />
               <InfoRow icon={Globe} label="Сайт" value={lead.website} href={lead.website} />
               <Separator className="my-2" />
               <InfoRow icon={MapPin} label="Страна" value={lead.country_name || '-'} />
               <InfoRow icon={MapPin} label="Город" value={lead.city_name || '-'} />
               <InfoRow icon={MapPin} label="Адрес" value={lead.address} />
             </CardContent>
          </Card>

          {/* System Info */}
          <Card className="shadow-sm">
             <CardHeader className="pb-3">
               <CardTitle className="text-lg flex items-center gap-2">
                 <Tag className="h-5 w-5 text-primary" /> Детали
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Теги</p>
                  <div className="flex flex-wrap gap-2">
                    {lead.tags && lead.tags.length > 0 ? (
                      lead.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="bg-secondary/50 text-secondary-foreground hover:bg-secondary/70">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground italic">Нет тегов</span>
                    )}
                  </div>
               </div>

               <Separator />

               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Источник</p>
                    <p className="text-sm font-medium">{sourceLabel}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Ответственный</p>
                    <div className="flex items-center gap-2 mt-1">
                       <Avatar className="h-6 w-6">
                         <AvatarFallback className="text-[10px] bg-primary/10">
                           {getInitials(lead.owner_name?.split(' ')[0], lead.owner_name?.split(' ')[1])}
                         </AvatarFallback>
                       </Avatar>
                       <p className="text-sm truncate max-w-[100px]" title={lead.owner_name || '-'}>
                         {lead.owner_name || '-'}
                       </p>
                    </div>
                  </div>
               </div>
            </CardContent>
            <CardFooter className="bg-muted/30 py-3 block">
               <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Создан: {lead.created_at ? dayjs(lead.created_at).format('DD.MM.YY') : '-'}</span>
                  <span>Обновлен: {lead.updated_at ? dayjs(lead.updated_at).format('DD.MM.YY') : '-'}</span>
               </div>
            </CardFooter>
          </Card>

        </div>

        {/* RIGHT COLUMN: Engagement Hub */}
        <div className="lg:col-span-8 space-y-6">

           <Tabs defaultValue="activity" className="w-full">
              <TabsList className="w-full justify-start h-12 p-1 bg-muted/40 border">
                 <TabsTrigger value="activity" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <History className="h-4 w-4 mr-2" /> Активность
                 </TabsTrigger>
                 <TabsTrigger value="notes" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <StickyNote className="h-4 w-4 mr-2" /> Заметки
                 </TabsTrigger>
                 <TabsTrigger value="messages" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <MessageSquare className="h-4 w-4 mr-2" /> Сообщения
                 </TabsTrigger>
                 <TabsTrigger value="calls" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <Phone className="h-4 w-4 mr-2" /> Звонки
                    <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1 py-0 text-[10px]">{callLogs.length}</Badge>
                 </TabsTrigger>
                 <TabsTrigger value="ai" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <MessageSquare className="h-4 w-4 mr-2" /> AI
                 </TabsTrigger>
              </TabsList>

              <div className="mt-6">
                 {/* Activity Tab */}
                 <TabsContent value="activity">
                    <Card className="border-none shadow-none bg-transparent">
                       <CardContent className="p-0">
                          {/* Placeholder for Timeline - mimicking the Antd structure but with Tailwind */}
                          <div className="relative pl-6 border-l-2 border-muted space-y-8 my-4 ml-4">
                             <div className="relative">
                                <span className="absolute -left-[29px] top-1 h-3 w-3 rounded-full border-2 border-green-500 bg-background" />
                                <div className="flex flex-col">
                                   <span className="font-medium text-foreground">Лид создан</span>
                                   <span className="text-sm text-muted-foreground mt-0.5">
                                      {lead.created_at ? dayjs(lead.created_at).format('DD.MM.YYYY HH:mm') : '-'}
                                   </span>
                                </div>
                             </div>

                             {/* Only show 'Status Changed' if updated > created significantly, or just show last update for now */}
                             <div className="relative">
                                <span className="absolute -left-[29px] top-1 h-3 w-3 rounded-full border-2 border-blue-500 bg-background" />
                                <div className="flex flex-col">
                                   <span className="font-medium text-foreground">Последнее обновление</span>
                                   <span className="text-sm text-muted-foreground mt-0.5">
                                     {lead.updated_at ? dayjs(lead.updated_at).format('DD.MM.YYYY HH:mm') : '-'}
                                   </span>
                                </div>
                             </div>

                             {lead.description && (
                                <div className="mt-6 bg-muted/30 p-4 rounded-lg border">
                                   <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                     <StickyNote className="h-4 w-4" /> Описание
                                   </h4>
                                   <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                      {lead.description}
                                   </p>
                                </div>
                             )}
                          </div>
                       </CardContent>
                    </Card>
                 </TabsContent>

                 {/* Notes Tab */}
                 <TabsContent value="notes">
                   <Card>
                     <CardContent className="p-8 text-center text-muted-foreground">
                       <div className="flex justify-center mb-4">
                         <div className="bg-muted rounded-full p-3">
                           <StickyNote className="h-6 w-6 text-muted-foreground/50" />
                         </div>
                       </div>
                       <p>Заметок пока нет</p>
                       <Button variant="link" className="mt-2 text-primary">Добавить заметку</Button>
                     </CardContent>
                   </Card>
                 </TabsContent>

                 {/* Messages Tab */}
                 <TabsContent value="messages">
                    <Card className="h-[600px] flex flex-col overflow-hidden">
                       <ChatWidget
                          entityType="lead"
                          entityId={lead.id}
                          entityName={fullName}
                          entityPhone={lead.phone}
                       />
                    </Card>
                 </TabsContent>

                 {/* Calls Tab */}
                 <TabsContent value="calls">
                   <Card>
                      <CardContent className="p-0">
                         {callLogsLoading ? (
                           <div className="p-8 text-center">Загрузка звонков...</div>
                         ) : callLogs.length === 0 ? (
                           <div className="p-12 text-center text-muted-foreground">
                             <Phone className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                             <p>История звонков пуста</p>
                           </div>
                         ) : (
                           <ScrollArea className="h-[500px]">
                              <div className="divide-y">
                                 {callLogs.map(log => (
                                    <div key={log.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                       <div className="flex items-center gap-4">
                                          <div className={`p-2 rounded-full ${log.direction === 'inbound' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                             <Phone className="h-4 w-4" />
                                          </div>
                                          <div>
                                             <p className="font-medium text-sm">
                                                {log.direction === 'inbound' ? 'Входящий звонок' : 'Исходящий звонок'}
                                             </p>
                                             <p className="text-xs text-muted-foreground">
                                                {dayjs(log.timestamp).format('DD.MM.YYYY HH:mm')} • {log.number || log.phone_number}
                                             </p>
                                          </div>
                                       </div>
                                       <div className="flex items-center gap-4">
                                          <span className="text-sm font-medium text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                                             {formatDuration(log.duration)}
                                          </span>
                                          <CallButton
                                            phone={log.number || log.phone_number}
                                            name={fullName}
                                            entityType="lead"
                                            entityId={lead.id}
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                          />
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           </ScrollArea>
                         )}
                      </CardContent>
                   </Card>
                 </TabsContent>

                 <TabsContent value="ai">
                   <AIAssistantPanel
                     entityType="lead"
                     entityId={lead.id}
                     defaultUseCase="next_action"
                     initialInput={`Подскажи 3 следующих шага по лиду "${fullName}".`}
                     contextData={{
                       full_name: fullName,
                       status: leadStatus,
                       title: lead.title || '',
                       company_name: lead.company_name || '',
                       source: sourceLabel,
                       owner_name: lead.owner_name || '',
                       phone: lead.phone || '',
                       email: lead.email || '',
                       budget: lead.budget || '',
                       description: lead.description || '',
                     }}
                   />
                 </TabsContent>
              </div>
           </Tabs>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Лид будет удален из системы навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Convert Dialog */}
      <AlertDialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
             <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 rounded-full text-green-700">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <AlertDialogTitle>Конвертация лида</AlertDialogTitle>
             </div>
            <AlertDialogDescription>
              Вы собираетесь конвертировать <strong>{fullName}</strong> в сделку.
              Это создаст новую карточку сделки и контакта.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleConvert} className="bg-green-600 hover:bg-green-700">
              Конвертировать
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Disqualify Dialog */}
       <AlertDialog open={disqualifyDialogOpen} onOpenChange={setDisqualifyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
             <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-100 rounded-full text-orange-700">
                  <XCircle className="h-5 w-5" />
                </div>
                <AlertDialogTitle>Дисквалификация</AlertDialogTitle>
             </div>
            <AlertDialogDescription>
              Лид будет помечен как <strong>Потерянный</strong>. Вы сможете вернуть его в работу позже, изменив статус.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisqualify} className="bg-orange-600 hover:bg-orange-700">
              Дисквалифицировать
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign Modal (Dialog) */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Назначить ответственного</DialogTitle>
            <DialogDescription>
              Выберите сотрудника для работы с этим лидом.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
               <Label>Ответственный</Label>
               <EntitySelect
                 value={selectedOwner}
                 onChange={setSelectedOwner}
                 fetchOptions={getUsers}
                 fetchById={getUser}
                 placeholder="Выберите пользователя"
               />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignModalOpen(false)}>Отмена</Button>
            <Button onClick={handleAssign} disabled={assigning}>
               {assigning ? 'Назначение...' : 'Назначить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

export default LeadDetail;
