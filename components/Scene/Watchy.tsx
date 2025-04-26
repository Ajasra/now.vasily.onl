import React, { useRef, useEffect, useState, use, forwardRef, MutableRefObject, useMemo, useCallback, memo } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Group, RepeatWrapping, Vector2, TextureLoader, Color, Object3D, Vector3, Layers, Euler, Matrix4, Quaternion, Material, MeshStandardMaterial, Mesh } from 'three';
import type { Texture, CanvasTexture } from 'three'; // Explicitly import CanvasTexture
import { SpringValue, animated } from '@react-spring/three';
import { useWatchScreenTexture } from '../../hooks/useWatchScreenTexture'; // Adjust path as needed

// Define props interface
interface WatchyProps {
  position?: SpringValue<[number, number, number]> | [number, number, number];
  scale?: number | Vector3;
  rotation?: Vector3 | Euler;
  active: number;
  // Allow any other props passed down
  [key: string]: any;
}

const lightColor = new Color('#FFCA88'); // Brighter color

// Wrap component with forwardRef
const WatchyComponent = forwardRef<Group, WatchyProps>((props, ref) => {
  const internalRef = useRef<Group>(null!);
  const groupRef = (ref as MutableRefObject<Group>) || internalRef;

  const { nodes, materials: gltfMaterials, scene } = useGLTF('/models/watchy.glb'); // Destructure nodes/materials if needed
  const [showTime, setShowTime] = useState(false);
  const [fontLoaded, setFontLoaded] = useState(false);
  const screenMaterialRef = useRef<MeshStandardMaterial | null>(null); // Ref to store the screen material

  const { active } = props;

  // Load custom font
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const fontFace = new FontFace('MonoFonto', `url(/font/monofonto.otf)`);

    fontFace.load()
      .then(font => {
        document.fonts.add(font);
        setFontLoaded(true);
        console.log('MonoFonto font loaded successfully');
      })
      .catch(err => {
        console.error('Failed to load MonoFonto font:', err);
      });
  }, []); // Runs once on mount

  // Find the screen material once on mount
  useEffect(() => {
      scene.traverse((node) => {
          // Check if it's the screen mesh
          if (node instanceof Mesh && node.material instanceof MeshStandardMaterial && node.material.name === 'screen.001') {
             screenMaterialRef.current = node.material;
          }
          // Potential optimization: If you know the exact name/path of the screen mesh, you could access it directly via `nodes` from useGLTF
          // e.g., if the screen mesh is named 'ScreenMesh', you could potentially do:
          // const screenMesh = nodes['ScreenMesh'] as Mesh;
          // if (screenMesh && screenMesh.material instanceof MeshStandardMaterial) {
          //     screenMaterialRef.current = screenMesh.material;
          // }
      });
  }, [scene]); // Depends only on the loaded scene


  // Use the custom hook for texture management
  const [screenTexture, now, toggleNow] = useWatchScreenTexture({ active, showTime, fontLoaded });

  // Apply the texture when it changes without triggering a re-render
  useEffect(() => {
    if (screenMaterialRef.current && screenTexture) {
      const material = screenMaterialRef.current;
      const isCanvas = (screenTexture as CanvasTexture).isCanvasTexture; // Check if it's a CanvasTexture

      material.map = screenTexture;
      material.color.set(lightColor); // Set color directly
      // Only apply emissive properties for the dynamic time texture
      if (isCanvas) {
        material.emissiveMap = screenTexture;
        material.emissive.set(lightColor); // Set emissive color
        material.emissiveIntensity = 1.0;
      } else {
         // Reset emissive for static texture if needed
         material.emissiveMap = null;
         material.emissive.set(0x000000); // Black or original emissive color
         material.emissiveIntensity = 0; // Or original intensity
      }
      material.needsUpdate = true;
    } else if (screenMaterialRef.current) {
        // Handle case where texture is null (e.g., initial load)
        screenMaterialRef.current.map = null;
        screenMaterialRef.current.emissiveMap = null;
        screenMaterialRef.current.needsUpdate = true;
    }
  }, [screenTexture]); // Re-run only when screenTexture changes

  // useFrame is currently empty, no optimization needed here yet
  useFrame((state, delta) => {
    // Optional animation could go here if needed in the future
  });

  // Memoize click handler if necessary, though unlikely needed here unless passed to memoized child
  const handleWatchyClick = useCallback((event: ThreeEvent<MouseEvent>) => {
    // Check if the clicked object is part of the Watchy model specifically (e.g., the case)
    // Using name 'Watchy_2' seems specific, ensure it's reliable.
    if (event.object.name === 'Watchy_2'){ 
      event.stopPropagation();
      // Toggle showTime state
      setShowTime(prevShowTime => !prevShowTime);
      // Trigger the 'now' state update logic within the hook
      toggleNow();
    }
  }, [toggleNow]); // Include toggleNow from the hook dependency

  const handlePointerMiss = useCallback((event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation(); // Prevent bubbling for misses on the model itself
  }, []);

  console.log('Watchy rendered');

  return (
    <animated.group
      ref={groupRef}
      {...props as any} // Keep 'as any' for simplicity with react-spring props
      dispose={null} // Prevent auto-disposal of GLTF scene by drei if group unmounts
    >
      <primitive
        object={scene} // Use the loaded scene directly
        scale={1.0}
        onClick={handleWatchyClick}
        onPointerMissed={handlePointerMiss} // Add the pointer missed handler
      />
    </animated.group>
  );
});

WatchyComponent.displayName = 'Watchy';

// Memoize the component to prevent re-rendering when props haven't changed
const Watchy = memo(WatchyComponent, (prevProps, nextProps) => {
  // Only re-render if active changes or position changes
  return prevProps.active === nextProps.active && 
         JSON.stringify(prevProps.position) === JSON.stringify(nextProps.position);
});

// Maintain the displayName for the memoized component
Watchy.displayName = 'Watchy';

// Preload the model remains the same
useGLTF.preload('/models/watchy.glb');

export default Watchy;
