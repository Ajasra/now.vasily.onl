import React from 'react';
import { Paper, ActionIcon, Text } from '@mantine/core';
import ReactMarkdown from 'react-markdown';
import styles from './Description/Description.module.css'; // Assuming styles are shared or adjust path

interface ConceptDescriptionProps {
  show: boolean;
  setShow: (show: boolean) => void;
  content: string;
  isWideScreen: boolean;
}

const ConceptDescription: React.FC<ConceptDescriptionProps> = ({
  show,
  setShow,
  content,
  isWideScreen,
}) => {
  if (!show) {
    return null;
  }

  return (
    <Paper
      p="xl"
      shadow="xs"
      className={`${styles.paper} ${isWideScreen ? styles.wide : styles.narrow}`}
      // Add styles for positioning, similar to ProjectDescription if needed
      style={{
        position: 'fixed',
        top: '50%', // Example positioning, adjust as needed
        left: isWideScreen ? 'calc(50% + 200px)' : '50%', // Adjust based on layout
        transform: 'translate(-50%, -50%)',
        zIndex: 1000, // Ensure it appears above other elements
        maxHeight: '80vh',
        overflowY: 'auto',
        width: isWideScreen ? '400px' : '90vw', // Adjust width
        // ... any other necessary styles
      }}
    >
      <ActionIcon
        radius="xl"
        size="sm"
        color="blue"
        variant="subtle"
        className={styles.close}
        onClick={() => setShow(false)}
      >
        X
      </ActionIcon>

      <div>
        <ReactMarkdown>{content}</ReactMarkdown>
        <Text size="sm" ta="right">
          <br />
          <a href="#" onClick={(e) => { e.preventDefault(); setShow(false); }}>Close</a>
        </Text>
      </div>
    </Paper>
  );
};

export default ConceptDescription; 