import * as React from 'react';

const ToastProvider = ({ children }) => children;
const ToastViewport = () => null;
const Toast = ({ children }) => children || null;
const ToastTitle = ({ children }) => children || null;
const ToastDescription = ({ children }) => children || null;
const ToastClose = () => null;
const ToastAction = ({ children }) => children || null;

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};
