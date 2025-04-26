import React, { useEffect, useState, memo } from 'react';
import { ProjectDetails } from '../../../types/project';
import { ActionIcon, Paper, Text } from '@mantine/core';
import ReactMarkdown from 'react-markdown';

import styles from './Description.module.css';

// Define props including the fetched data
interface ProjectDescriptionProps {
  // active: number; // No longer needed directly for fetching
  show: boolean;
  setShow: (show: boolean) => void;
  isWideScreen: boolean;
  projectDetails: ProjectDetails | null; // Receive project details
  projectDescription: string;          // Receive description markdown
  isLoading: boolean;                  // Receive loading state
  error: string;                       // Receive error state
  // onTitleUpdate?: (title: string) => void; // No longer needed
}

// Use props directly, remove internal state and fetching logic
export default memo(function ProjectDescription({
  show,
  setShow,
  isWideScreen,
  projectDetails,
  projectDescription,
  isLoading, 
  error
}: ProjectDescriptionProps) {
  // Remove internal state
  // const [project, setProject] = useState<ProjectDetails | null>(null);
  // const [description, setDescription] = useState("");
  // const [isLoading, setIsLoading] = useState(false);
  // const [error, setError] = useState("");

  console.log('Description rerender')

  // Remove fetching useEffect
  // useEffect(() => { ... }, [active, setShow, onTitleUpdate]);

  if (!show) {
    return null;
  }

  // Use isLoading prop for loading state
  if (isLoading) {
    return <div>Loading project information...</div>;
  }

  // Use error prop for error state
  if (error) {
    return <div>Error: {error}</div>;
  }

  function handleClose() {
    setShow(false);
  }

  // Calculate paperClassName directly
  const derivedPaperClassName = `${styles.paper} ${isWideScreen ? styles.wide : styles.narrow}`;

  return (
    <>
      <Paper p="xl" shadow="xs" className={derivedPaperClassName}>
        <ActionIcon radius="xl" size="sm" color="blue" variant="subtle" className={styles.close} onClick={handleClose}>
          X
        </ActionIcon>
        {/* Use projectDetails and projectDescription props */} 
        {projectDetails ? (
          <>
            <ReactMarkdown>{projectDescription}</ReactMarkdown>
            <Text size='sm'>
              {projectDetails.sid} <br />{projectDetails.model}
            </Text>
            <Text size='sm' ta='right'>
              <br />
              <a href="#" onClick={handleClose}>Close</a>
            </Text>
          </>
        ) : (
          // Display a message if details are null but no error/loading
          <Text>Project details not available.</Text>
        )}
      </Paper>
    </>
  );
});