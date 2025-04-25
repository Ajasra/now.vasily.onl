import React, { useEffect, useState } from 'react';
import { ProjectDetails } from '../../../types/project';
import { ActionIcon, Paper, Text } from '@mantine/core';
import ReactMarkdown from 'react-markdown';

import styles from './Description.module.css';

interface ProjectDescriptionProps {
  active: number;
}

export default function ProjectDescription({ active }: ProjectDescriptionProps) {
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);

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
        setShow(true);
      } catch (err) {
        console.error("Error fetching project:", err);
        setError("Failed to load project data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [active]);

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

  return (
    <>
        {show ? (
        
            <Paper padding="xl" shadow="xs" className={styles.paper}>
                <ActionIcon radius="xl" size="sm" color="blue" variant="subtle" className={styles.close} onClick={handleClose}>
                    X
                </ActionIcon>
                {/* <Title order={2}>{project?.title}</Title> */}
                <ReactMarkdown>{description}</ReactMarkdown>
                <Text size='sm'>
                    {project.sid} <br />{project.model}
                </Text>
            </Paper>
        ) : (
            <></>
        )}
    </>
  );
}