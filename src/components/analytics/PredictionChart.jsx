import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Chart from 'chart.js/auto';

/**
 * Prediction/Forecast chart component with confidence intervals
 * Shows predicted values with upper and lower bounds
 */
function PredictionChart({ 
  labels = [], 
  predictedData = [], 
  confidenceLower = [], 
  confidenceUpper = [],
  title = 'Прогноз выручки',
  height = 300,
}) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const ctx = chartRef.current.getContext('2d');

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Create new chart
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Прогноз',
            data: predictedData,
            borderColor: 'rgb(24, 144, 255)',
            backgroundColor: 'rgba(24, 144, 255, 0.1)',
            borderWidth: 3,
            fill: false,
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 7,
          },
          {
            label: 'Верхняя граница',
            data: confidenceUpper,
            borderColor: 'rgba(24, 144, 255, 0.3)',
            backgroundColor: 'rgba(24, 144, 255, 0.05)',
            borderWidth: 1,
            borderDash: [5, 5],
            fill: '+1',
            tension: 0.4,
            pointRadius: 0,
          },
          {
            label: 'Нижняя граница',
            data: confidenceLower,
            borderColor: 'rgba(24, 144, 255, 0.3)',
            backgroundColor: 'rgba(24, 144, 255, 0.05)',
            borderWidth: 1,
            borderDash: [5, 5],
            fill: false,
            tension: 0.4,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          title: {
            display: true,
            text: title,
            font: {
              size: 16,
              weight: 'bold',
            },
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat('ru-RU', {
                    style: 'currency',
                    currency: 'RUB',
                    minimumFractionDigits: 0,
                  }).format(context.parsed.y);
                }
                return label;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            ticks: {
              callback: function(value) {
                return new Intl.NumberFormat('ru-RU', {
                  style: 'currency',
                  currency: 'RUB',
                  minimumFractionDigits: 0,
                  notation: 'compact',
                  compactDisplay: 'short',
                }).format(value);
              }
            }
          }
        }
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [labels, predictedData, confidenceLower, confidenceUpper, title]);

  return (
    <div style={{ position: 'relative', height: `${height}px` }}>
      <canvas ref={chartRef}></canvas>
    </div>
  );
}

PredictionChart.propTypes = {
  labels: PropTypes.array.isRequired,
  predictedData: PropTypes.array.isRequired,
  confidenceLower: PropTypes.array,
  confidenceUpper: PropTypes.array,
  title: PropTypes.string,
  height: PropTypes.number,
};

export default PredictionChart;
