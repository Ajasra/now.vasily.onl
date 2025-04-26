import React from 'react';
import { IconInfoCircle } from '@tabler/icons-react';

interface ShowDetailsButtonProps {
  onClick: () => void;
  disabled: boolean;
  buttonText: string;
}

const ShowDetailsButton: React.FC<ShowDetailsButtonProps> = ({ onClick, disabled, buttonText }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        position: 'fixed',
        bottom: '30px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        padding: '10px 20px',
        fontSize: '16px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        backgroundColor: '#181818',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        opacity: disabled ? 0.6 : 1,
        transition: 'opacity 0.3s ease, background-color 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '8px', // Space between icon and text
      }}
    >
      <IconInfoCircle size={24} />
      {buttonText}
    </button>
  );
};

export default ShowDetailsButton; 