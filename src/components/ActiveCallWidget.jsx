/**
 * ActiveCallWidget Component
 * Widget for managing active call with controls
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Avatar, Input, App, Tooltip, Tag, theme } from 'antd';
import {
  AudioMutedOutlined,
  AudioOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  SwapOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { addCallNote } from '../lib/api/telephony';
import sipClient from '../lib/telephony/SIPClient.js';
import ChannelBrandIcon from './channel/ChannelBrandIcon.jsx';

const { TextArea } = Input;

export default function ActiveCallWidget({ call, onCallEnd, onUpdate }) {
  const { message } = App.useApp();
  const { token } = theme.useToken();
  const [muted, setMuted] = useState(false);
  const [onHold, setOnHold] = useState(false);
  const [duration, setDuration] = useState(0);
  const [note, setNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [transferNumber, setTransferNumber] = useState('');
  const [showTransferInput, setShowTransferInput] = useState(false);

  useEffect(() => {
    if (!call) return;

    const timer = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [call]);

  if (!call) return null;

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMute = async () => {
    try {
      const nextState = sipClient.toggleMute();
      setMuted(nextState);
      message.success(nextState ? 'Микрофон выключен' : 'Микрофон включен');
      onUpdate?.();
    } catch (error) {
      message.error('Ошибка управления микрофоном');
    }
  };

  const handleHold = async () => {
    try {
      const nextState = sipClient.toggleHold();
      setOnHold(nextState);
      message.success(nextState ? 'Звонок поставлен на удержание' : 'Звонок возобновлен');
      onUpdate?.();
    } catch (error) {
      message.error('Ошибка управления удержанием');
    }
  };

  const handleTransfer = async () => {
    if (!transferNumber) {
      message.error('Введите номер для перевода');
      return;
    }

    try {
      const transferred = sipClient.transferCall(transferNumber);
      if (transferred) {
        message.success('Звонок переведен');
        setShowTransferInput(false);
        setTransferNumber('');
        onUpdate?.();
      } else {
        message.error('Не удалось перевести звонок');
      }
    } catch (error) {
      message.error('Ошибка перевода звонка');
    }
  };

  const handleEnd = async () => {
    try {
      sipClient.hangup();
      message.success('Звонок завершен');
      onCallEnd?.();
    } catch (error) {
      message.error('Ошибка завершения звонка');
    }
  };

  const handleSaveNote = async () => {
    if (!note.trim()) {
      setShowNoteInput(false);
      return;
    }

    try {
      await addCallNote(call.id, note);
      message.success('Заметка сохранена');
      setNote('');
      setShowNoteInput(false);
      onUpdate?.();
    } catch (error) {
      message.error('Ошибка сохранения заметки');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 1000,
        width: 320,
      }}
    >
      <Card
        style={{
          boxShadow: token.boxShadowSecondary,
          borderRadius: 8,
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {/* Call Info */}
          <div style={{ textAlign: 'center' }}>
            <Avatar size={64} icon={<ChannelBrandIcon channel="telephony" size={28} />} style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 16, fontWeight: 500 }}>
              {call.contact_name || call.number}
            </div>
            <div style={{ fontSize: 12, color: token.colorTextSecondary }}>
              {call.number}
            </div>
            <Tag color={call.direction === 'incoming' ? 'green' : 'blue'} style={{ marginTop: 8 }}>
              {call.direction === 'incoming' ? 'Входящий' : 'Исходящий'}
            </Tag>
          </div>

          {/* Duration */}
          <div style={{ textAlign: 'center', fontSize: 24, fontWeight: 'bold' }}>
            {formatDuration(duration)}
          </div>

          {/* Status */}
          {onHold && (
            <div style={{ textAlign: 'center' }}>
              <Tag color="warning">На удержании</Tag>
            </div>
          )}

          {/* Call Controls */}
          <Space style={{ width: '100%', justifyContent: 'center' }} size="small">
            <Tooltip title={muted ? 'Включить микрофон' : 'Выключить микрофон'}>
              <Button
                shape="circle"
                icon={muted ? <AudioMutedOutlined /> : <AudioOutlined />}
                onClick={handleMute}
                type={muted ? 'primary' : 'default'}
              />
            </Tooltip>

            <Tooltip title={onHold ? 'Возобновить' : 'Удержание'}>
              <Button
                shape="circle"
                icon={onHold ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
                onClick={handleHold}
                type={onHold ? 'primary' : 'default'}
              />
            </Tooltip>

            <Tooltip title="Перевести звонок">
              <Button
                shape="circle"
                icon={<SwapOutlined />}
                onClick={() => setShowTransferInput(!showTransferInput)}
              />
            </Tooltip>

            <Tooltip title="Заметки">
              <Button
                shape="circle"
                icon={<FileTextOutlined />}
                onClick={() => setShowNoteInput(!showNoteInput)}
              />
            </Tooltip>

            <Tooltip title="Завершить звонок">
              <Button
                shape="circle"
                danger
                icon={<CloseCircleOutlined />}
                onClick={handleEnd}
                type="primary"
              />
            </Tooltip>
          </Space>

          {/* Transfer Input */}
          {showTransferInput && (
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="Номер для перевода"
                value={transferNumber}
                onChange={(e) => setTransferNumber(e.target.value)}
              />
              <Button type="primary" onClick={handleTransfer}>
                Перевести
              </Button>
            </Space.Compact>
          )}

          {/* Note Input */}
          {showNoteInput && (
            <div>
              <TextArea
                rows={3}
                placeholder="Заметки о звонке..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                style={{ marginBottom: 8 }}
              />
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button size="small" onClick={() => setShowNoteInput(false)}>
                  Отмена
                </Button>
                <Button size="small" type="primary" onClick={handleSaveNote}>
                  Сохранить
                </Button>
              </Space>
            </div>
          )}
        </Space>
      </Card>
    </div>
  );
}
