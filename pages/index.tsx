import React, { useState, useEffect, useCallback, memo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { NextPage } from 'next';
import { useSpring, a } from '@react-spring/three';
import WatchyComponent from '../components/Scene/Watchy';
import SpinningLightComponent from '../components/Scene/SpinningLight';
import ModelsTimelineComponent from '../components/UI/Timeline';
import ProjectDescriptionComponent from '../components/UI/Description';
import ConceptDescriptionComponent from '../components/UI/ConceptDescription';
import ToolbarComponent from '../components/UI/Toolbar';
import ShowDetailsButtonComponent from '../components/UI/ShowDetailsButton';
import CopyrightTextComponent from '../components/UI/CopyrightText';
import { ProjectDetails } from '../types/project';

// Memoized child components
const Watchy = memo(WatchyComponent);
const SpinningLight = memo(SpinningLightComponent);
const ModelsTimeline = memo(ModelsTimelineComponent);
const ProjectDescription = memo(ProjectDescriptionComponent);
const ConceptDescription = memo(ConceptDescriptionComponent);
const Toolbar = memo(ToolbarComponent);
const ShowDetailsButton = memo(ShowDetailsButtonComponent);
const CopyrightText = memo(CopyrightTextComponent);

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

  // Effect to fetch concept markdown on mount
  useEffect(() => {
    const fetchConceptContent = async () => {
      try {
        const response = await fetch('/projects/concept.md');
        if (!response.ok) {
          throw new Error('Failed to fetch concept description');
        }
        const markdown = await response.text();
        setConceptContent(markdown);
      } catch (error) {
        console.error('Error fetching concept markdown:', error);
        setConceptContent('Failed to load concept description.'); // Provide fallback content
      }
    };

    fetchConceptContent();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Update button disabled logic: Only disabled while animating
  const isButtonDisabled = isAnimating;

  const handleButtonClick = useCallback(() => {
    if (!isButtonDisabled) {
      setDescriptionRequested(true);
      // On mobile screens, show description immediately without waiting for animation
      if (!isWideScreen) {
        setIsDescriptionVisible(true);
      }
    }
  }, [isButtonDisabled, isWideScreen]); // Added isWideScreen dependency

  const handleSetDescriptionVisible = useCallback((visible: boolean) => {
    setIsDescriptionVisible(visible);
    if (!visible) {
      setDescriptionRequested(false);
    }
  }, []); // Dependency: isConceptVisible (and setIsConceptVisible which is stable)

  // Simplified handler for toggling concept visibility
  const handleConceptToggle = useCallback(() => {
    setIsConceptVisible(isVis => !isVis);
  }, []); // No dependencies needed as it uses the functional update form

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
        show={isDescriptionVisible} 
        setShow={handleSetDescriptionVisible}
        isWideScreen={isWideScreen}
        projectDetails={projectDetails}
        projectDescription={projectDescription}
        isLoading={isFetchingDescription}
        error={fetchError}
      />
      <ConceptDescription
        show={isConceptVisible}
        setShow={setIsConceptVisible}
        content={conceptContent}
        isWideScreen={isWideScreen}
      />
      <ModelsTimeline active={active} setActive={setActive} />

      <ShowDetailsButton
        onClick={handleButtonClick}
        disabled={isButtonDisabled}
        buttonText={projectTitle ? projectTitle : 'Show Details'}
      />
      <Toolbar handleConceptToggle={handleConceptToggle} />
      <CopyrightText />
    </>
  );
};

export default IndexPage;
