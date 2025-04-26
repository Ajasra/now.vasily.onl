import React, { useEffect, useState, memo } from 'react';
import { ProjectDetails } from '../../../types/project';
import { ActionIcon, Paper, Text } from '@mantine/core';
import ReactMarkdown from 'react-markdown';

import styles from './Description.module.css';

// Define props including the fetched data
interface ProjectDescriptionProps {
  show: boolean;
  setShow: (show: boolean) => void;
  isWideScreen: boolean;
  projectDetails: ProjectDetails | null; 
  projectDescription: string;
  isLoading: boolean; 
  error: string;                      
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

  console.log('Description rerender')


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
          <Text>Project details not available.</Text>
        )}
      </Paper>
    </>
  );
});