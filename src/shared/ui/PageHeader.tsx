import React from 'react';
import { Breadcrumb, Flex, Grid, Typography, theme } from 'antd';
import { HomeOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

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
        marginBottom: 10,
        padding: isMobile ? 10 : 12,
        borderRadius: token.borderRadiusLG,
        border: `1px solid ${token.colorBorderSecondary}`,
        background: token.colorBgElevated,
        boxShadow: token.boxShadowTertiary,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          insetInline: 0,
          top: 0,
          height: 2,
          background: `linear-gradient(90deg, ${token.colorPrimary} 0%, ${token.colorInfo} 100%)`,
        }}
      />
      <Flex vertical gap={10}>
        {breadcrumbs?.length ? (
          <div>
            <Breadcrumb
              items={breadcrumbItems}
              style={{ color: token.colorTextSecondary, fontWeight: 500, fontSize: 12 }}
            />
          </div>
        ) : null}

        <Flex
          justify="space-between"
          align={isMobile ? 'flex-start' : 'center'}
          gap={10}
          vertical={isMobile}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <Title
              level={isMobile ? 4 : 3}
              style={{ margin: 0, letterSpacing: '-0.02em', color: token.colorTextBase }}
            >
              {title}
            </Title>
            {subtitle ? (
              <Paragraph
                type="secondary"
                style={{
                  marginTop: 4,
                  marginBottom: 0,
                  maxWidth: 920,
                  fontSize: isMobile ? 12 : 13,
                  lineHeight: 1.4,
                  color: token.colorTextSecondary,
                }}
              >
                {subtitle}
              </Paragraph>
            ) : null}
          </div>

          {extra ? (
            <div
              style={{
                width: isMobile ? '100%' : 'auto',
                flexShrink: 0,
                padding: isMobile ? 0 : 2,
                borderRadius: token.borderRadiusLG,
                background: isMobile ? 'transparent' : token.colorBgContainer,
                border: isMobile ? 'none' : `1px solid ${token.colorBorderSecondary}`,
              }}
            >
              {extra}
            </div>
          ) : null}
        </Flex>

        {children ? (
          <div
            style={{
              paddingTop: 6,
              borderTop: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            {children}
          </div>
        ) : null}
      </Flex>
    </div>
  );
};
