import React from 'react';
import { Breadcrumb, Flex, Grid, Typography, theme } from 'antd';
import { HomeOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: { title: string; href?: string }[];
  extra?: React.ReactNode;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  extra,
  children,
}) => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const { token } = theme.useToken();

  const breadcrumbItems = [
    {
      title: <HomeOutlined />,
      href: '/#/dashboard',
    },
    ...(breadcrumbs ?? []).map((item) => ({
      title: item.title,
      href: item.href,
    })),
  ];

  return (
    <div
      className="page-header"
      style={{
        marginBottom: 24,
        padding: isMobile ? 16 : 20,
        borderRadius: token.borderRadiusLG,
        border: `1px solid ${token.colorBorderSecondary}`,
        background: token.colorBgElevated,
        boxShadow: token.boxShadowTertiary,
      }}
    >
      <Flex vertical gap={16}>
        {breadcrumbs?.length ? (
          <Breadcrumb
            items={breadcrumbItems}
            style={{ color: token.colorTextSecondary }}
          />
        ) : null}

        <Flex
          justify="space-between"
          align={isMobile ? 'flex-start' : 'center'}
          gap={16}
          vertical={isMobile}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>
              {title}
            </Title>
            {subtitle ? (
              <Paragraph
                type="secondary"
                style={{
                  marginTop: 6,
                  marginBottom: 0,
                  maxWidth: 960,
                }}
              >
                {subtitle}
              </Paragraph>
            ) : null}
          </div>

          {extra ? (
            <div style={{ width: isMobile ? '100%' : 'auto', flexShrink: 0 }}>
              {extra}
            </div>
          ) : null}
        </Flex>

        {children ? (
          <div
            style={{
              paddingTop: 4,
              borderTop: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            <Text type="secondary">{children}</Text>
          </div>
        ) : null}
      </Flex>
    </div>
  );
};
