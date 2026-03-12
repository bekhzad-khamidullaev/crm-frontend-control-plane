import * as React from 'react';
import { Input as AntInput } from 'antd';

const Textarea = React.forwardRef((props, ref) => <AntInput.TextArea ref={ref} autoSize={{ minRows: 3 }} {...props} />);

Textarea.displayName = 'Textarea';

export { Textarea };
