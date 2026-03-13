/**
 * AudioPlayer Component
 * Custom audio player with Ant Design styling
 */

import React, { useState, useRef, useEffect } from 'react';
import { Button, Slider, Space, Typography, Tooltip } from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  SoundOutlined,
  DownloadOutlined,
  ForwardOutlined,
  BackwardOutlined,
} from '@ant-design/icons';
import { useTheme } from '../lib/hooks/useTheme.js';

const { Text } = Typography;

function AudioPlayer({ src, filename = 'recording.webm' }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value) => {
    const audio = audioRef.current;
    audio.currentTime = value;
    setCurrentTime(value);
  };

  const handleVolumeChange = (value) => {
    const audio = audioRef.current;
    audio.volume = value;
    setVolume(value);
  };

  const handleSpeedChange = (rate) => {
    const audio = audioRef.current;
    audio.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const skip = (seconds) => {
    const audio = audioRef.current;
    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds));
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: isDark ? '#1e232e' : '#f5f5f5',
        border: `1px solid ${isDark ? '#2d3343' : '#e5e7eb'}`,
        borderRadius: '8px',
      }}
    >
      <audio ref={audioRef} src={src} preload="metadata" />
      
      {/* Progress bar */}
      <div style={{ marginBottom: 16 }}>
        <Slider
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          tooltip={{ formatter: formatTime }}
          step={0.1}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text type="secondary">{formatTime(currentTime)}</Text>
          <Text type="secondary">{formatTime(duration)}</Text>
        </div>
      </div>

      {/* Controls */}
      <Space size="middle" style={{ width: '100%', justifyContent: 'center' }}>
        <Tooltip title="Назад 10 сек">
          <Button
            icon={<BackwardOutlined />}
            onClick={() => skip(-10)}
            size="large"
          />
        </Tooltip>
        
        <Button
          type="primary"
          shape="circle"
          icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
          onClick={togglePlay}
          size="large"
          style={{ width: 56, height: 56 }}
        />
        
        <Tooltip title="Вперед 10 сек">
          <Button
            icon={<ForwardOutlined />}
            onClick={() => skip(10)}
            size="large"
          />
        </Tooltip>
      </Space>

      {/* Additional controls */}
      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Volume control */}
        <Space style={{ width: 150 }}>
          <SoundOutlined />
          <Slider
            min={0}
            max={1}
            step={0.1}
            value={volume}
            onChange={handleVolumeChange}
            style={{ width: 100 }}
          />
        </Space>

        {/* Playback speed */}
        <Space>
          <Text type="secondary">Скорость:</Text>
          <Button
            size="small"
            type={playbackRate === 0.75 ? 'primary' : 'default'}
            onClick={() => handleSpeedChange(0.75)}
          >
            0.75x
          </Button>
          <Button
            size="small"
            type={playbackRate === 1 ? 'primary' : 'default'}
            onClick={() => handleSpeedChange(1)}
          >
            1x
          </Button>
          <Button
            size="small"
            type={playbackRate === 1.25 ? 'primary' : 'default'}
            onClick={() => handleSpeedChange(1.25)}
          >
            1.25x
          </Button>
          <Button
            size="small"
            type={playbackRate === 1.5 ? 'primary' : 'default'}
            onClick={() => handleSpeedChange(1.5)}
          >
            1.5x
          </Button>
        </Space>

        {/* Download button */}
        <Tooltip title="Скачать запись">
          <Button
            icon={<DownloadOutlined />}
            onClick={handleDownload}
          >
            Скачать
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}

export default AudioPlayer;
