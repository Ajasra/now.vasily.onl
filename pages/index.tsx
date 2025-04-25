import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { NextPage } from 'next';
import { useSpring, animated } from '@react-spring/three'; 
import Watchy from '../components/Scene/Watchy';
import SpinningLight from '../components/Scene/SpinningLight';
import ModelsTimeline from '../components/UI/Timeline';
import ProjectDescription from '../components/UI/Description';
import { Group } from 'three';
import { IconBrandGithub, IconInfoCircle, IconFileDescription } from '@tabler/icons-react';
import { ActionIcon, Text, Paper } from '@mantine/core';
import ReactMarkdown from 'react-markdown';
import styles from '../components/UI/Description/Description.module.css';

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

// Wrap Watchy for animation
const AnimatedWatchyComponent = animated(Watchy);

// Define a type that matches the expected props, including potential animated props
type AnimatedWatchyProps = React.ComponentProps<typeof AnimatedWatchyComponent>; 

const IndexPage: NextPage = () => {
  const [active, setActive] = useState(0); 
  const [isDescriptionVisible, setIsDescriptionVisible] = useState(false); 
  const [isAnimating, setIsAnimating] = useState(false); 
  const [projectTitle, setProjectTitle] = useState<string>('');
  const [isConceptVisible, setIsConceptVisible] = useState(false);
  const [conceptContent, setConceptContent] = useState<string>('');
  const isWideScreen = useMediaQuery('(min-width: 1024px)'); 

  const watchDefaultPosition: [number, number, number] = [1.2, -1.2, 0];
  const watchShiftedLeftPosition: [number, number, number] = [-0.5, -1.2, 0];

  const { position } = useSpring({
    position: isWideScreen && isDescriptionVisible 
      ? watchShiftedLeftPosition
      : watchDefaultPosition,
    config: { duration: 1000 }, 
    onStart: () => setIsAnimating(true),
    onRest: () => setIsAnimating(false),
  });

  // Cast the component during usage if needed, or ensure props match AnimatedWatchyProps
  const AnimatedWatchy = AnimatedWatchyComponent as React.FC<AnimatedWatchyProps>;

  // Update button disabled logic: Only disabled while animating
  const isButtonDisabled = isAnimating;

  const handleButtonClick = () => {
    // Allow setting visible if not animating (button is hidden when description is open)
    if (!isButtonDisabled) {
      setIsDescriptionVisible(true);
    }
  };

  // Callback to receive project title from ProjectDescription
  const handleProjectTitleUpdate = (title: string) => {
    setProjectTitle(title);
  };

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
        <AnimatedWatchy 
          position={position as any} 
          scale={0.07} 
          rotation={[Math.PI / 2, 0, Math.PI]} // Use Math.PI directly
          active={active}
        />
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
        setShow={setIsDescriptionVisible} 
        isWideScreen={isWideScreen}
        onTitleUpdate={handleProjectTitleUpdate}
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

      {/* Concept Description Component using ProjectDescription styling */}
      {isConceptVisible && (
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
      )}

      {/* GitHub Link */}
      <ActionIcon
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

      {/* Concept Info Icon */}
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
      </ActionIcon>
    </>
  );
};

export default IndexPage;
