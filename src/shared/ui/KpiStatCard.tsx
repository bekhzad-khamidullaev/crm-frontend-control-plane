import type { CSSProperties, ReactNode } from 'react';
import { Card, Statistic } from 'antd';
import type { StatisticProps } from 'antd';

interface KpiStatCardProps {
  className?: string;
  title: ReactNode;
  value: StatisticProps['value'];
  children?: ReactNode;
  prefix?: ReactNode;
  suffix?: ReactNode;
  loading?: boolean;
  valueStyle?: CSSProperties;
  width?: number | string;
  height?: number;
  borderRadius?: number;
  bodyPadding?: number | string;
  titleMinHeight?: number;
  cardStyle?: CSSProperties;
}

export function KpiStatCard({
  className,
  title,
  value,
  children,
  prefix,
  suffix,
  loading = false,
  valueStyle,
  width = 170,
  height = 96,
  borderRadius = 12,
  bodyPadding = '8px 10px',
  titleMinHeight = 34,
  cardStyle,
}: KpiStatCardProps) {
  return (
    <Card
      className={className}
      size="small"
      loading={loading}
      style={{ width, height, borderRadius, ...cardStyle }}
      bodyStyle={{
        padding: bodyPadding,
        height,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <Statistic
        title={
          <span
            style={{
              display: 'block',
              minHeight: titleMinHeight,
              lineHeight: 1.2,
            }}
          >
            {title}
          </span>
        }
        value={value}
        prefix={prefix}
        suffix={suffix}
        valueStyle={valueStyle}
      />
      {children}
    </Card>
  );
}

export default KpiStatCard;
