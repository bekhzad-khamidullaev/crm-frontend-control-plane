/**
 * IncomingCallModal
 * Modal to handle incoming calls via WebSocket notifications
 */

import React, { useState, useEffect } from 'react';
import { Phone, X, User, PhoneCall, Mail } from 'lucide-react';

import sipClient from '../../lib/telephony/SIPClient.js';
import { api } from '../../lib/api/client.js';
import { Dialog, DialogContent } from '../../components/ui/dialog.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { Avatar, AvatarFallback } from '../../components/ui/avatar.jsx';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert.jsx';
import { Skeleton } from '../../components/ui/skeleton.jsx';

function IncomingCallModal({ visible, callData, onAnswer, onReject }) {
  const [searchingContact, setSearchingContact] = useState(false);
  const [contactInfo, setContactInfo] = useState(null);

  useEffect(() => {
    if (visible && callData?.phoneNumber) {
      searchContactByPhone(callData.phoneNumber);
    }
  }, [visible, callData]);

  const searchContactByPhone = async (phoneNumber) => {
    setSearchingContact(true);
    try {
      const response = await api.get('/api/contacts/', {
        params: { search: phoneNumber },
      });

      if (response.data.results && response.data.results.length > 0) {
        setContactInfo({
          type: 'contact',
          data: response.data.results[0],
        });
        return;
      }

      const leadsResponse = await api.get('/api/leads/', {
        params: { search: phoneNumber },
      });

      if (leadsResponse.data.results && leadsResponse.data.results.length > 0) {
        setContactInfo({
          type: 'lead',
          data: leadsResponse.data.results[0],
        });
      }
    } catch (error) {
      console.error('Error searching contact:', error);
    } finally {
      setSearchingContact(false);
    }
  };

  const handleAnswer = () => {
    onAnswer?.(callData);
    const audioElement = document.getElementById('incoming-call-audio');
    if (audioElement) {
      sipClient.answerCall(audioElement);
    }
  };

  const handleReject = () => {
    onReject?.(callData);
    sipClient.rejectCall();
  };

  if (!callData) return null;

  return (
    <Dialog open={visible}>
      <DialogContent className="max-w-lg">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600">
            <PhoneCall className="h-10 w-10 animate-pulse" />
          </div>

          <div>
            <h2 className="text-xl font-semibold">Входящий звонок</h2>
          </div>

          {searchingContact ? (
            <div className="w-full space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ) : contactInfo ? (
            <div className="flex flex-col items-center gap-3">
              <Avatar className="h-16 w-16">
                <AvatarFallback>
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-lg font-semibold">
                  {contactInfo.data.first_name} {contactInfo.data.last_name}
                </div>
                <Badge variant={contactInfo.type === 'contact' ? 'secondary' : 'default'}>
                  {contactInfo.type === 'contact' ? 'Контакт' : 'Лид'}
                </Badge>
              </div>
              {contactInfo.data.company && (
                <div className="text-sm text-muted-foreground">{contactInfo.data.company}</div>
              )}
              {contactInfo.data.email && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {contactInfo.data.email}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Avatar className="h-16 w-16">
                <AvatarFallback>
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div className="text-lg font-semibold">{callData.callerName || 'Неизвестный номер'}</div>
              <Alert className="text-left">
                <AlertTitle>Контакт не найден</AlertTitle>
                <AlertDescription>Контакт не найден в CRM</AlertDescription>
              </Alert>
            </div>
          )}

          <div className="flex items-center gap-2 text-lg font-semibold">
            <Phone className="h-5 w-5 text-primary" />
            {callData.phoneNumber}
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            <Button variant="destructive" size="lg" onClick={handleReject}>
              <X className="mr-2 h-5 w-5" />
              Отклонить
            </Button>
            <Button size="lg" className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={handleAnswer}>
              <Phone className="mr-2 h-5 w-5" />
              Ответить
            </Button>
          </div>

          <audio id="incoming-call-audio" autoPlay className="hidden" />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default IncomingCallModal;
