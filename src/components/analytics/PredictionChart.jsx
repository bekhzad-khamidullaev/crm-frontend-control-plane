import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Chart from 'chart.js/auto';
import { Card, Empty, theme, Typography } from 'antd';
import { formatAnalyticsMonetaryValue } from '../../lib/utils/analyticsCurrency.js';

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
  currencyCode = null,
}) {
  const { token } = theme.useToken();
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const hasData = Array.isArray(predictedData) && predictedData.length > 0;

  useEffect(() => {
    if (!chartRef.current || !hasData) return;

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
            borderColor: token.colorPrimary,
            backgroundColor: token.colorPrimaryBg,
            borderWidth: 3,
            fill: false,
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 7,
          },
          {
            label: 'Верхняя граница',
            data: confidenceUpper,
            borderColor: token.colorPrimaryBorder,
            backgroundColor: token.colorPrimaryBgHover,
            borderWidth: 1,
            borderDash: [5, 5],
            fill: '+1',
            tension: 0.4,
            pointRadius: 0,
          },
          {
            label: 'Нижняя граница',
            data: confidenceLower,
            borderColor: token.colorPrimaryBorder,
            backgroundColor: token.colorPrimaryBgHover,
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
                  label += formatAnalyticsMonetaryValue(context.parsed.y, { currencyCode });
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
                return formatAnalyticsMonetaryValue(value, { currencyCode });
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
  }, [labels, predictedData, confidenceLower, confidenceUpper, title, token.colorPrimary, token.colorPrimaryBg, token.colorPrimaryBgHover, token.colorPrimaryBorder, hasData, currencyCode]);

  return (
    <Card size="small" styles={{ body: { padding: 12 } }}>
      <Typography.Title level={5} style={{ marginTop: 0, marginBottom: 12 }}>
        {title}
      </Typography.Title>
      {!hasData ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Нет данных для построения прогноза"
        />
      ) : (
        <div style={{ position: 'relative', height: `${height}px` }}>
          <canvas ref={chartRef} />
        </div>
      )}
    </Card>
  );
}

PredictionChart.propTypes = {
  labels: PropTypes.array.isRequired,
  predictedData: PropTypes.array.isRequired,
  confidenceLower: PropTypes.array,
  confidenceUpper: PropTypes.array,
  title: PropTypes.string,
  height: PropTypes.number,
  currencyCode: PropTypes.string,
};

export default PredictionChart;
