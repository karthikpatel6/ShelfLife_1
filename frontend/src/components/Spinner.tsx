import React from 'react';

export const Spinner: React.FC<{ size?: number }> = ({ size }) => {
  const style = size ? { width: `${size}px`, height: `${size}px` } : {};
  return <div className="spinner" style={style}></div>;
};
