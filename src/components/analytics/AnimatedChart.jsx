import React, { useEffect, useRef } from 'react';
import { Skeleton } from 'antd';
import { Doughnut, Bar, Line, Pie } from 'react-chartjs-2';

/**
 * AnimatedChart - обертка для Chart.js с встроенными анимациями
 * @param {string} type - тип чарта: 'doughnut', 'bar', 'line', 'pie'
 * @param {Object} data - данные для чарта
 * @param {Object} options - опции Chart.js
 * @param {boolean} loading - состояние загрузки
 * @param {number} height - высота чарта
 * @param {string} animationType - тип анимации: 'default', 'smooth', 'bounce', 'elastic'
 * @param {number} animationDuration - длительность анимации в мс
 */
function AnimatedChart({ 
  type = 'bar',
  data,
  options = {},
  loading = false,
  height = 300,
  animationType = 'default',
  animationDuration = 1000,
  className = '',
}) {
  const chartRef = useRef(null);

  // Настройки анимаций по типам
  const animationConfigs = {
    default: {
      duration: animationDuration,
      easing: 'easeInOutQuart',
    },
    smooth: {
      duration: animationDuration * 1.2,
      easing: 'easeInOutCubic',
      delay: (context) => {
        let delay = 0;
        if (context.type === 'data' && context.mode === 'default') {
          delay = context.dataIndex * 50;
        }
        return delay;
      },
    },
    bounce: {
      duration: animationDuration * 1.5,
      easing: 'easeOutBounce',
    },
    elastic: {
      duration: animationDuration * 1.3,
      easing: 'easeOutElastic',
    },
  };

  // Объединяем пользовательские опции с анимациями
  const enhancedOptions = {
    responsive: true,
    maintainAspectRatio: false,
    ...options,
    animation: {
      ...animationConfigs[animationType],
      ...(options.animation || {}),
      onComplete: (animation) => {
        // Callback после завершения анимации
        if (options.animation?.onComplete) {
          options.animation.onComplete(animation);
        }
      },
    },
    // Добавляем hover анимации
    hover: {
      mode: 'nearest',
      intersect: true,
      animationDuration: 200,
      ...(options.hover || {}),
    },
    // Transitions при изменении данных
    transitions: {
      active: {
        animation: {
          duration: 300,
        },
      },
      ...(options.transitions || {}),
    },
  };

  // Компоненты чартов по типам
  const ChartComponents = {
    doughnut: Doughnut,
    bar: Bar,
    line: Line,
    pie: Pie,
  };

  const ChartComponent = ChartComponents[type] || Bar;

  // Loading skeleton
  if (loading) {
    return (
      <div style={{ height }} className="chart-skeleton">
        <Skeleton.Input active style={{ width: '100%', height: '100%' }} />
      </div>
    );
  }

  // Empty state
  if (!data || !data.datasets || data.datasets.length === 0) {
    return (
      <div 
        style={{ 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#999',
        }}
      >
        Нет данных для отображения
      </div>
    );
  }

  return (
    <div 
      className={`chart-wrapper loaded ${className}`}
      style={{ height, position: 'relative' }}
    >
      <ChartComponent 
        ref={chartRef}
        data={data} 
        options={enhancedOptions}
      />
    </div>
  );
}

export default AnimatedChart;
