import React from 'react';
import { Card, Typography, Empty } from 'antd';
import { CheckSquareOutlined } from '@ant-design/icons';

const { Title } = Typography;

function TasksList() {
  return (
    <div>
      <Title level={2}>Задачи</Title>
      <Card>
        <Empty
          image={<CheckSquareOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
          description="Модуль задач в разработке"
        />
      </Card>
    </div>
  );
}

export default TasksList;
