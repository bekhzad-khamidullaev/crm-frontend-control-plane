/**
 * Утилиты для создания стандартизированных колонок таблиц
 * Все колонки следуют единому дизайну как в модуле Deals
 */

import { Space, Avatar, Tag, Progress, Tooltip } from 'antd';
import {
  UserOutlined,
  ShopOutlined,
  DollarOutlined,
  MailOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

// Общие стили
const styles = {
  primaryText: {
    fontWeight: 500,
    fontSize: 13,
  },
  secondaryText: {
    fontSize: 11,
    color: '#999',
  },
  warningText: {
    fontSize: 11,
    color: '#faad14',
  },
  dangerText: {
    fontSize: 11,
    color: '#ff4d4f',
  },
};

/**
 * Создает колонку с двухстрочным форматом
 * Основной текст (жирный) + дополнительный текст (серый, мелкий)
 */
export function createTwoLineColumn({
  title,
  dataIndex,
  primaryKey,
  secondaryKey,
  width = 200,
  icon: Icon,
  sorter,
  ...restProps
}) {
  return {
    title,
    dataIndex,
    key: dataIndex || primaryKey,
    width,
    render: (_, record) => {
      const primaryValue = primaryKey ? record[primaryKey] : record[dataIndex];
      const secondaryValue = secondaryKey ? record[secondaryKey] : null;

      return (
        <div>
          <div style={styles.primaryText}>{primaryValue || '-'}</div>
          {secondaryValue && (
            <div style={styles.secondaryText}>
              {Icon && <Icon style={{ marginRight: 4 }} />}
              {secondaryValue}
            </div>
          )}
        </div>
      );
    },
    sorter: sorter || ((a, b) => {
      const aVal = primaryKey ? a[primaryKey] : a[dataIndex];
      const bVal = primaryKey ? b[primaryKey] : b[dataIndex];
      return String(aVal || '').localeCompare(String(bVal || ''));
    }),
    ...restProps,
  };
}

/**
 * Создает колонку для отображения суммы денег
 */
export function createAmountColumn({
  title = 'Сумма',
  dataIndex = 'amount',
  width = 130,
  currency = '₽',
  locale = 'ru-RU',
  iconColor = '#52c41a',
  ...restProps
}) {
  return {
    title,
    dataIndex,
    key: dataIndex,
    width,
    render: (amount) => (
      <Space>
        <DollarOutlined style={{ color: iconColor }} />
        <span style={styles.primaryText}>
          {amount ? amount.toLocaleString(locale) : '0'} {currency}
        </span>
      </Space>
    ),
    sorter: (a, b) => (a[dataIndex] || 0) - (b[dataIndex] || 0),
    ...restProps,
  };
}

/**
 * Создает колонку с цветными тегами (для статусов, типов и т.д.)
 */
export function createTagColumn({
  title,
  dataIndex,
  width = 120,
  colorMap = {},
  textMap = {},
  filters,
  ...restProps
}) {
  return {
    title,
    dataIndex,
    key: dataIndex,
    width,
    render: (value) => {
      const color = colorMap[value] || 'default';
      const text = textMap[value] || value;
      return <Tag color={color}>{text}</Tag>;
    },
    filters: filters || Object.keys(textMap).map((key) => ({
      text: textMap[key],
      value: key,
    })),
    onFilter: (value, record) => record[dataIndex] === value,
    ...restProps,
  };
}

/**
 * Создает колонку с прогресс-баром
 */
export function createProgressColumn({
  title = 'Прогресс',
  dataIndex = 'progress',
  width = 120,
  thresholds = { success: 70, normal: 40 },
  ...restProps
}) {
  return {
    title,
    dataIndex,
    key: dataIndex,
    width,
    render: (percent) => (
      <Progress
        percent={percent || 0}
        size="small"
        status={
          percent >= thresholds.success
            ? 'success'
            : percent >= thresholds.normal
            ? 'normal'
            : 'exception'
        }
      />
    ),
    sorter: (a, b) => (a[dataIndex] || 0) - (b[dataIndex] || 0),
    ...restProps,
  };
}

/**
 * Создает колонку с аватаром и именем (двухстрочную)
 */
export function createAvatarColumn({
  title = 'Контакт',
  nameKey = 'name',
  secondaryKey,
  avatarKey = 'avatar',
  width = 180,
  icon = <UserOutlined />,
  ...restProps
}) {
  return {
    title,
    key: nameKey,
    width,
    render: (_, record) => {
      const name = record[nameKey];
      const secondary = secondaryKey ? record[secondaryKey] : null;
      const avatar = record[avatarKey];

      return (
        <Space>
          <Avatar size="small" src={avatar} icon={!avatar && icon} />
          <div>
            <div style={styles.primaryText}>{name || '-'}</div>
            {secondary && <div style={styles.secondaryText}>{secondary}</div>}
          </div>
        </Space>
      );
    },
    sorter: (a, b) => String(a[nameKey] || '').localeCompare(String(b[nameKey] || '')),
    ...restProps,
  };
}

/**
 * Создает колонку для дат с подсветкой дедлайнов
 */
export function createDateColumn({
  title = 'Дата',
  dataIndex = 'date',
  width = 120,
  format = 'DD.MM.YYYY',
  showDeadlineWarning = false,
  warningDays = 7,
  ...restProps
}) {
  return {
    title,
    dataIndex,
    key: dataIndex,
    width,
    render: (date) => {
      if (!date) return '-';

      const dateObj = dayjs(date);
      const today = dayjs();
      const daysLeft = dateObj.diff(today, 'day');

      return (
        <div>
          <div style={styles.primaryText}>{dateObj.format(format)}</div>
          {showDeadlineWarning && daysLeft >= 0 && daysLeft <= warningDays && (
            <div style={styles.warningText}>через {daysLeft} дн.</div>
          )}
          {showDeadlineWarning && daysLeft < 0 && (
            <div style={styles.dangerText}>просрочено</div>
          )}
        </div>
      );
    },
    sorter: (a, b) => {
      const aDate = dayjs(a[dataIndex]);
      const bDate = dayjs(b[dataIndex]);
      return aDate.valueOf() - bDate.valueOf();
    },
    ...restProps,
  };
}

/**
 * Создает колонку для email с иконкой
 */
export function createEmailColumn({
  title = 'Email',
  dataIndex = 'email',
  width = 200,
  ...restProps
}) {
  return {
    title,
    dataIndex,
    key: dataIndex,
    width,
    render: (email) => {
      if (!email) return '-';
      return (
        <Space size="small">
          <MailOutlined style={{ color: '#999' }} />
          <a href={`mailto:${email}`} style={styles.primaryText}>
            {email}
          </a>
        </Space>
      );
    },
    ...restProps,
  };
}

/**
 * Создает колонку для телефона с иконкой
 */
export function createPhoneColumn({
  title = 'Телефон',
  dataIndex = 'phone',
  width = 150,
  ClickToCallComponent,
  ...restProps
}) {
  return {
    title,
    dataIndex,
    key: dataIndex,
    width,
    render: (phone, record) => {
      if (!phone) return '-';
      
      if (ClickToCallComponent) {
        return (
          <ClickToCallComponent
            phoneNumber={phone}
            contactName={record.name}
            contactId={record.id}
            entityType="contact"
            size="small"
            type="link"
          />
        );
      }

      return (
        <Space size="small">
          <PhoneOutlined style={{ color: '#999' }} />
          <a href={`tel:${phone}`} style={styles.primaryText}>
            {phone}
          </a>
        </Space>
      );
    },
    ...restProps,
  };
}

/**
 * Создает колонку для компании с иконкой
 */
export function createCompanyColumn({
  title = 'Компания',
  dataIndex = 'company',
  width = 180,
  ...restProps
}) {
  return {
    title,
    dataIndex,
    key: dataIndex,
    width,
    render: (company) => {
      if (!company) return '-';
      return (
        <Space size="small">
          <ShopOutlined style={{ color: '#999' }} />
          <span style={styles.primaryText}>{company}</span>
        </Space>
      );
    },
    sorter: (a, b) => String(a[dataIndex] || '').localeCompare(String(b[dataIndex] || '')),
    ...restProps,
  };
}

/**
 * Создает стандартизированную колонку действий
 */
export function createActionsColumn({
  width = 100,
  CallButtonComponent,
  QuickActionsComponent,
  phoneKey = 'phone',
  nameKey = 'name',
  ...restProps
}) {
  return {
    title: 'Действия',
    key: 'actions',
    width,
    fixed: 'right',
    align: 'center',
    render: (_, record) => (
      <Space size="small">
        {CallButtonComponent && record[phoneKey] && (
          <CallButtonComponent
            phone={record[phoneKey]}
            name={record[nameKey]}
            entityType="entity"
            entityId={record.id}
            size="small"
          />
        )}
        {QuickActionsComponent && <QuickActionsComponent record={record} />}
      </Space>
    ),
    ...restProps,
  };
}

/**
 * Создает колонку с аватаром группы (для команд)
 */
export function createAvatarGroupColumn({
  title = 'Команда',
  dataIndex = 'team',
  width = 150,
  maxCount = 3,
  ...restProps
}) {
  const { Group: AvatarGroup } = Avatar;
  
  return {
    title,
    dataIndex,
    key: dataIndex,
    width,
    render: (team) => {
      if (!team || !Array.isArray(team) || team.length === 0) return '-';

      return (
        <AvatarGroup maxCount={maxCount}>
          {team.map((member, index) => (
            <Tooltip key={index} title={member.name}>
              <Avatar
                size="small"
                src={member.avatar}
                icon={!member.avatar ? <UserOutlined /> : undefined}
              >
                {!member.avatar && member.name ? member.name.charAt(0) : null}
              </Avatar>
            </Tooltip>
          ))}
        </AvatarGroup>
      );
    },
    ...restProps,
  };
}

export default {
  createTwoLineColumn,
  createAmountColumn,
  createTagColumn,
  createProgressColumn,
  createAvatarColumn,
  createDateColumn,
  createEmailColumn,
  createPhoneColumn,
  createCompanyColumn,
  createActionsColumn,
  createAvatarGroupColumn,
};
