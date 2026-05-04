import React from 'react';
import { Button, Result } from 'antd';
import { navigate } from '../../router';

function FormPermissionGuard({
  allowed,
  listPath,
  listButtonText,
  description,
  children,
}) {
  if (!allowed) {
    return (
      <Result
        status="403"
        title="Недостаточно прав"
        subTitle={description || 'У вас нет прав для выполнения этого действия.'}
        extra={<Button onClick={() => navigate(listPath)}>{listButtonText || 'К списку'}</Button>}
      />
    );
  }

  return children;
}

export default FormPermissionGuard;
