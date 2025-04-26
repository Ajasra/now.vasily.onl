import React from 'react';
import { Text } from '@mantine/core';

const CopyrightText: React.FC = () => {
  return (
    <Text
      style={{
        position: 'fixed',
        bottom: '12px',
        left: '12px',
        zIndex: 500,
        color: '#555555',
        opacity: 0.7,
        fontSize: '14px'
      }}
    >
      © vasily.onl
    </Text>
  );
};

export default CopyrightText; 