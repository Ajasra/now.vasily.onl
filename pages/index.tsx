import React, { useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { NextPage } from 'next';
import { useSpring, a } from '@react-spring/three';
import Watchy from '../components/Scene/Watchy';
import SpinningLight from '../components/Scene/SpinningLight';
import ModelsTimeline from '../components/UI/Timeline';
import ProjectDescription from '../components/UI/Description';
import { Group } from 'three';
import { IconBrandGithub, IconInfoCircle, IconFileDescription } from '@tabler/icons-react';
import { ActionIcon, Text, Paper } from '@mantine/core';
import ReactMarkdown from 'react-markdown';
import styles from '../components/UI/Description/Description.module.css';
import { ProjectDetails } from '../types/project';

// Simple hook to check media query
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    window.addEventListener('resize', listener);
    return () => window.removeEventListener('resize', listener);
  }, [matches, query]);

  return matches;
};

const IndexPage: NextPage = () => {
  const [active, setActive] = useState(0); 
  const [isDescriptionVisible, setIsDescriptionVisible] = useState(false); 
  const [isAnimating, setIsAnimating] = useState(false); 
  const [projectTitle, setProjectTitle] = useState<string>('');
  const [isConceptVisible, setIsConceptVisible] = useState(false);
  const [conceptContent, setConceptContent] = useState<string>('');
  const [descriptionRequested, setDescriptionRequested] = useState(false);
  
  // State for fetched project data
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null);
  const [projectDescription, setProjectDescription] = useState<string>('');
  const [isFetchingDescription, setIsFetchingDescription] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string>('');

  const isWideScreen = useMediaQuery('(min-width: 1024px)'); 

  const watchDefaultPosition: [number, number, number] = [1.2, -1.2, 0];
  const watchShiftedLeftPosition: [number, number, number] = [-0.5, -1.2, 0];

  const springProps = useSpring({
    position: isWideScreen && descriptionRequested 
      ? watchShiftedLeftPosition
      : watchDefaultPosition,
    config: { duration: 1000 }, 
    onStart: () => setIsAnimating(true),
    onRest: (result) => {
      setIsAnimating(false);
      // Compare array elements for value equality
      const targetReached = 
        result.value.position[0] === watchShiftedLeftPosition[0] &&
        result.value.position[1] === watchShiftedLeftPosition[1] &&
        result.value.position[2] === watchShiftedLeftPosition[2];

      if (descriptionRequested && targetReached) {
        setIsDescriptionVisible(true);
      }
    },
  });

  // Effect to fetch project data when 'active' changes
  useEffect(() => {
    const fetchProjectData = async () => {
      if (active === null || active === undefined) {
        setProjectDetails(null);
        setProjectDescription('');
        setProjectTitle('');
        setFetchError('');
        return;
      }
      
      setIsFetchingDescription(true);
      setFetchError('');
      
      try {
        // Add 1 to active index since project IDs seem 1-based in the API
        const response = await fetch(`/api/project/${active + 1}`); 
        
        if (!response.ok) {
          throw new Error(`Failed to fetch project: ${response.status}`);
        }
        
        const data = await response.json();
        setProjectDetails(data.details);
        setProjectDescription(data.description);
        
        // Update project title state here
        if (data.details && data.details.title) {
          setProjectTitle(data.details.title);
        } else {
          setProjectTitle(''); // Reset title if no title found
        }
      } catch (err: any) {
        console.error("Error fetching project data in IndexPage:", err);
        setFetchError(err.message || "Failed to load project data");
        setProjectDetails(null);
        setProjectDescription('');
        setProjectTitle(''); // Reset title on error
      } finally {
        setIsFetchingDescription(false);
      }
    };

    fetchProjectData();
  }, [active]); // Dependency array includes only 'active'

  // Update button disabled logic: Only disabled while animating
  const isButtonDisabled = isAnimating;

  const handleButtonClick = () => {
    if (!isButtonDisabled) {
      setDescriptionRequested(true);
    }
  };

  const handleSetDescriptionVisible = useCallback((visible: boolean) => {
    setIsDescriptionVisible(visible);
    if (!visible) {
      setDescriptionRequested(false);
    }
  }, []);

  // Handler for toggling concept visibility and fetching content
  const handleConceptToggle = async () => {
    if (!isConceptVisible) {
      // If not visible, we're about to show it, so fetch content
      try {
        const response = await fetch('/projects/concept.md');
        if (!response.ok) {
          throw new Error('Failed to fetch concept description');
        }
        const markdown = await response.text();
        setConceptContent(markdown);
        setIsConceptVisible(true);
      } catch (error) {
        console.error('Error fetching concept markdown:', error);
        // You could add error state and show a message if needed
      }
    } else {
      // Just hide it if it's already visible
      setIsConceptVisible(false);
    }
  };

  return (
    <>
      <Canvas
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'transparent'
        }}
        camera={{ position: [0, 0, 5], fov: 75 }}
      >
        <ambientLight intensity={0.2} />
        <SpinningLight />
        <a.group position={springProps.position}>
          <Watchy 
            scale={0.07} 
            rotation={[Math.PI / 2, 0, Math.PI]}
            active={active}
          />
        </a.group>
        <OrbitControls 
        enablePan={false}
        enableZoom={false}
        enableRotate={true}
        maxPolarAngle={Math.PI / 1.2}
        minPolarAngle={Math.PI / 4}
        maxAzimuthAngle={Math.PI / 3}
        minAzimuthAngle={-Math.PI / 3}
        />
      </Canvas>
      <ProjectDescription 
        active={active} 
        show={isDescriptionVisible} 
        setShow={handleSetDescriptionVisible}
        isWideScreen={isWideScreen}
        projectDetails={projectDetails}
        projectDescription={projectDescription}
        isLoading={isFetchingDescription}
        error={fetchError}
      />
      <ModelsTimeline active={active} setActive={setActive} />

      <button
        onClick={handleButtonClick}
        disabled={isButtonDisabled}
        style={{
          position: 'fixed',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10, 
          padding: '10px 20px',
          fontSize: '16px',
          cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
          backgroundColor: '#181818',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          opacity: isButtonDisabled ? 0.6 : 1,
          transition: 'opacity 0.3s ease, background-color 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '8px', // Space between icon and text
        }}
      >
        <IconInfoCircle size={24} />
        {projectTitle ? projectTitle : 'Show Details'}
      </button>


      {/* {isConceptVisible && (
        <Paper 
          p="xl" 
          shadow="xs" 
          className={`${styles.paper} ${isWideScreen ? styles.wide : styles.narrow}`}
        >
          <ActionIcon 
            radius="xl" 
            size="sm" 
            color="blue" 
            variant="subtle" 
            className={styles.close} 
            onClick={() => setIsConceptVisible(false)}
          >
            X
          </ActionIcon>
          
          <div>
            <ReactMarkdown>{conceptContent}</ReactMarkdown>
            <Text size="sm" ta="right">
              <br />
              <a href="#" onClick={() => setIsConceptVisible(false)}>Close</a>
            </Text>
          </div>
        </Paper>
      )} */}


      {/* <ActionIcon
        component="a"
        href="https://github.com/Ajasra/NOW"
        target="_blank"
        rel="noopener noreferrer"
        title="View project on GitHub"
        variant="transparent"
        size="xl"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 500,
          color: '#555555',
          opacity: 0.7,
          transition: 'opacity 0.3s ease',
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
      >
        <IconBrandGithub size={32} />
      </ActionIcon>


      <ActionIcon
        onClick={handleConceptToggle}
        title="View project concept"
        variant="transparent"
        size="xl"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '70px', // Position to the left of GitHub icon
          zIndex: 500,
          color: '#555555',
          opacity: 0.7,
          transition: 'opacity 0.3s ease',
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
      >
        <IconFileDescription size={32} />
      </ActionIcon> */}

      <Text
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          zIndex: 500,
          color: '#555555',
          opacity: 0.7,
          fontSize: '14px'
        }}
      >
        © vasily.onl
      </Text>
    </>
  );
};

export default IndexPage;
