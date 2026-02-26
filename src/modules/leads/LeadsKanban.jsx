import React, { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  User,
  Mail,
  Phone,
  Plus,
  GripVertical,
  Briefcase
} from 'lucide-react';
import { navigate } from '../../router';
import { getLeads, leadsApi } from '../../lib/api/client';
import { buildLeadPayload, deriveLeadStatus } from '../../lib/utils/leads';

// Shadcn Components
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { ScrollArea } from "../../components/ui/scroll-area";
import { useToast } from "../../components/ui/use-toast";

const statusColumns = {
  new: { title: 'Новые', color: 'bg-blue-100 text-blue-700', borderColor: 'border-blue-200' },
  converted: { title: 'Конвертированы', color: 'bg-teal-100 text-teal-700', borderColor: 'border-teal-200' },
  lost: { title: 'Потеряны', color: 'bg-red-100 text-red-700', borderColor: 'border-red-200' },
};

function SortableLeadCard({ lead, config }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleCardClick = (e) => {
    if (e.target.closest('.drag-handle')) return;
    navigate(`/leads/${lead.id}`);
  };

  const getInitials = (first, last) => `${first?.[0]||''}${last?.[0]||''}`.toUpperCase();

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="mb-3">
      <Card
        className={`cursor-pointer hover:shadow-md transition-all ${isDragging ? 'ring-2 ring-primary rotate-2' : ''}`}
        onClick={handleCardClick}
      >
        <CardContent className="p-3">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px]">
                  {getInitials(lead.first_name, lead.last_name)}
                </AvatarFallback>
              </Avatar>
              <div className="text-sm font-medium leading-none">
                {lead.first_name} {lead.last_name}
              </div>
            </div>
            <div
              {...listeners}
              className="drag-handle cursor-grab text-muted-foreground hover:text-foreground p-1"
            >
               <GripVertical className="h-4 w-4" />
            </div>
          </div>

          <div className="space-y-1">
             {lead.company_name && (
               <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Briefcase className="h-3 w-3" /> {lead.company_name}
               </div>
             )}
             {lead.email && (
               <div className="text-xs text-muted-foreground flex items-center gap-1 overflow-hidden text-ellipsis">
                  <Mail className="h-3 w-3" /> {lead.email}
               </div>
             )}
             {lead.phone && (
               <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {lead.phone}
               </div>
             )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DroppableColumn({ status, config, children, count, onAddNew }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col h-full rounded-lg bg-muted/40 p-2 min-w-[280px] w-full ${isOver ? 'bg-muted/60 ring-2 ring-primary/20' : ''}`}
    >
      <div className={`flex items-center justify-between p-2 mb-2 border-b-2 ${config.borderColor}`}>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={config.color}>
             {count}
          </Badge>
          <span className="font-medium">{config.title}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onAddNew}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 pr-2">
        <div className="min-h-[100px]">
           {children}
        </div>
      </ScrollArea>
    </div>
  );
}

function LeadsKanban() {
  const { toast } = useToast();
  const [columns, setColumns] = useState({ new: [], converted: [], lost: [] });
  const [loading, setLoading] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const response = await getLeads({ page_size: 100 });
      const leads = response.results || [];

      const grouped = { new: [], converted: [], lost: [] };
      leads.forEach((lead) => {
        const status = deriveLeadStatus(lead);
        if (grouped[status]) grouped[status].push(lead);
        else grouped.new.push(lead);
      });
      setColumns(grouped);
    } catch (error) {
      toast({ variant: "destructive", title: "Ошибка", description: "Не удалось загрузить лиды" });
    } finally {
      setLoading(false);
    }
  };

  const findContainer = (id) => {
    if (id in columns) return id;
    return Object.keys(columns).find((key) => columns[key].some((l) => l.id === id));
  };

  const handleDragStart = (event) => setActiveId(event.active.id);

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id) || over.id;

    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    setColumns((prev) => {
      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer];
      const activeIndex = activeItems.findIndex((i) => i.id === active.id);
      const overIndex = overItems.findIndex((i) => i.id === over.id);

      let newIndex;
      if (over.id in prev) newIndex = overItems.length;
      else newIndex = overIndex >= 0 ? overIndex : 0;

      const updatedLead = { ...activeItems[activeIndex], __status: overContainer };

      return {
        ...prev,
        [activeContainer]: activeItems.filter((i) => i.id !== active.id),
        [overContainer]: [
          ...overItems.slice(0, newIndex),
          updatedLead,
          ...overItems.slice(newIndex),
        ],
      };
    });
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id) || over.id;

    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    const activeLead = columns[activeContainer]?.find((l) => l.id === active.id); // Note: might be in overContainer in state already due to optimisic DragOver

    // Actually, due to DragOver logic, the item is ALREADY moved in state 'columns'.
    // but without API call confirming it.
    // Wait, DragOver manages the visual move. DragEnd should finalize payload.
    // In current implementation DragOver modifies state. So activeLead is now in overContainer?
    // Let's check where it is.

    // Safety check:
    let lead = activeLead;
    let fromStatus = activeContainer;

    // Check if it's already in overContainer (it should be due to dragOver)
    if (!lead) {
       lead = columns[overContainer].find(l => l.id === active.id);
       fromStatus = overContainer; // It's logically here now.
    }

    if (!lead) return;

    try {
        // Optimistic update already happened in dragOver.
        // We just api call now.
        // Identify target status
        const targetStatus = overContainer;

        // We only care if status CHANGED from what it was in DB?
        // But we don't know DB state efficiently. We assume if container changed, we update.
        // BUT dragOver logic already moved it. So activeContainer === overContainer at this point?
        // findContainer will return overContainer.

        // So we need to detect cross-container move.
        // standard dnd-kit logic: dragOver handles sorting between containers.
        // effectively we just need to update the status of the item based on where it landed.

        const finalContainer = findContainer(active.id);

        // Update API
        if (finalContainer === 'lost') await leadsApi.disqualify(lead.id, buildLeadPayload(lead));
        else if (finalContainer === 'converted') await leadsApi.convert(lead.id, buildLeadPayload(lead));
        else if (finalContainer === 'new') await leadsApi.patch(lead.id, { disqualified: false });

        toast({ title: "Статус обновлен", description: `Лид перемещен в ${statusColumns[finalContainer].title}` });
    } catch (error) {
       toast({ variant: "destructive", title: "Ошибка", description: "Не удалось обновить статус" });
       fetchLeads(); // Revert
    }
  };

  const activeLead = activeId
    ? Object.values(columns).flat().find((lead) => lead.id === activeId)
    : null;

  if (loading && !Object.values(columns).flat().length) {
    return <div className="p-10 text-center">Загрузка...</div>;
  }

  return (
    <div className="kanban-board h-full">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full items-start">
          {Object.entries(statusColumns).map(([status, config]) => (
            <DroppableColumn
              key={status}
              status={status}
              config={config}
              count={columns[status].length}
              onAddNew={() => navigate('/leads/new')}
            >
              <SortableContext
                id={status}
                items={columns[status].map((l) => l.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3 min-h-[50px]">
                  {columns[status].map((lead) => (
                    <SortableLeadCard
                      key={lead.id}
                      lead={lead}
                      config={config}
                    />
                  ))}
                </div>
              </SortableContext>
            </DroppableColumn>
          ))}
        </div>

        <DragOverlay>
           {activeLead ? (
              <Card className="w-[280px] shadow-xl rotate-2 cursor-grabbing">
                 <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                       <Avatar className="h-6 w-6"><AvatarFallback>AB</AvatarFallback></Avatar>
                       <span className="font-medium">{activeLead.first_name}</span>
                    </div>
                 </CardContent>
              </Card>
           ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

export default LeadsKanban;
