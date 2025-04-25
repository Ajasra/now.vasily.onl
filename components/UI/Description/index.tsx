import React, { useEffect, useState } from 'react';
import { ProjectDetails } from '../../../types/project';
import { ActionIcon, Paper, Text } from '@mantine/core';
import ReactMarkdown from 'react-markdown';

import styles from './Description.module.css';

interface ProjectDescriptionProps {
  active: number;
  show: boolean;
  setShow: (show: boolean) => void;
  isWideScreen: boolean;
  onTitleUpdate?: (title: string) => void;
}

export default function ProjectDescription({ active, show, setShow, isWideScreen, onTitleUpdate }: ProjectDescriptionProps) {
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProject = async () => {
      if (active === null || active === undefined) return;
      
      setIsLoading(true);
      setError("");
      
      try {
        const response = await fetch(`/api/project/${active+1}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch project: ${response.status}`);
        }
        
        const data = await response.json();
        setProject(data.details);
        setDescription(data.description);
        
        if (onTitleUpdate && data.details && data.details.title) {
          onTitleUpdate(data.details.title);
        }
      } catch (err) {
        console.error("Error fetching project:", err);
        setError("Failed to load project data");
        setShow(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (active !== null && active !== undefined) {
       fetchProject();
    } else {
       setShow(false);
       setProject(null);
       setDescription("");
       if (onTitleUpdate) {
         onTitleUpdate('');
       }
    }

  }, [active, setShow, onTitleUpdate]);

  if (!show) {
    return null;
  }

  if (isLoading) {
    return <div>Loading project information...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  console.log(project);

  function handleClose() {
    setShow(false);
  }

  const paperClassName = `${styles.paper} ${isWideScreen ? styles.wide : styles.narrow}`;

  return (
    <>
        <Paper p="xl" shadow="xs" className={paperClassName}>
            <ActionIcon radius="xl" size="sm" color="blue" variant="subtle" className={styles.close} onClick={handleClose}>
                X
            </ActionIcon>
            {project ? (
              <>
                <ReactMarkdown>{description}</ReactMarkdown>
                <Text size='sm'>
                  {project.sid} <br />{project.model}
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
}