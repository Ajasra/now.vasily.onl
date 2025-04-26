import React from 'react';
import { ActionIcon, Paper } from '@mantine/core';
import { IconBrandGithub, IconFileDescription } from '@tabler/icons-react';

interface ToolbarProps {
  handleConceptToggle: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ handleConceptToggle }) => {
  return (
    <Paper
      p="xs"
      radius="sm"
      style={{
        position: 'fixed',
        bottom: '0px',
        right: '0px',
        zIndex: 500,
        display: 'flex',
        gap: '0px', // Space between icons
        backgroundColor: 'rgba(255, 255, 255, 0.0)', // Optional: slightly transparent background
      }}
    >
      <ActionIcon
        onClick={handleConceptToggle}
        title="View project concept"
        variant="subtle" // Changed variant for better look on Paper
        color="dark"
        size="xl"
      >
        <IconFileDescription size={28} />
      </ActionIcon>
      <ActionIcon
        component="a"
        href="https://github.com/Ajasra/NOW"
        target="_blank"
        rel="noopener noreferrer"
        title="View project on GitHub"
        variant="subtle" // Changed variant for better look on Paper
        color="dark"
        size="xl"
      >
        <IconBrandGithub size={28} />
      </ActionIcon>
    </Paper>
  );
};

export default Toolbar; 