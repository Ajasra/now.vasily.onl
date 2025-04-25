import React, { useRef, useEffect, useState, use, forwardRef, MutableRefObject } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Group, RepeatWrapping, Vector2, CanvasTexture, TextureLoader, Color, Object3D, Vector3, Layers, Euler, Matrix4, Quaternion, Material, MeshStandardMaterial } from 'three';
import type { Texture } from 'three';
import { SpringValue, animated } from '@react-spring/three';

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
const Watchy = forwardRef<Group, WatchyProps>((props, ref) => { // Use forwardRef and typed props
  // Use the forwarded ref or create a local one if none is passed
  const internalRef = useRef<Group>(null!); 
  // Assign the forwarded ref OR the internal ref to groupRef.
  // This handles cases where the parent component might not pass a ref.
  const groupRef = (ref as MutableRefObject<Group>) || internalRef;

  const { scene } = useGLTF('/models/watchy.glb');
  // Update state type to allow Texture or CanvasTexture
  const [screenTexture, setScreenTexture] = useState<CanvasTexture | Texture | null>(null);
  const [watchyObj, setWatchyObj] = useState<Object3D | null>(null);
  const [showTime, setShowTime] = useState(false);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [now, setNow] = useState(false);

  const [project, setProject] = useState(null);
  const [description, setDescription] = useState("");

  const { active } = props; // Props are now typed
  
  // Load custom font
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const fontFace = new FontFace('MonoFonto', `url(/font/monofonto.otf)`);
    
    fontFace.load()
      .then(font => {
        // Add font to document fonts
        document.fonts.add(font);
        setFontLoaded(true);
        console.log('MonoFonto font loaded successfully');
      })
      .catch(err => {
        console.error('Failed to load MonoFonto font:', err);
      });
  }, []);
  
  // Create texture function directly in component
  const createDateTimeTexture = (
    width: number = 400,
    height: number = 400,
    options = {
      padding: 20,
      edition: 1,
      sid: "12345678"
    }
  ): CanvasTexture | null => {
    // Check if we're in a browser environment
    if (typeof document === 'undefined') {
      console.warn('createDateTimeTexture called in a non-browser environment');
      return null;
    }

    // Create canvas element
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    
    if (!context) {
      console.error('Could not get canvas context');
      return null;
    }
    
    // Create update function to refresh time
    const updateCanvas = () => {
      // Clear canvas
      context.fillStyle = 'black';
      context.fillRect(0, 0, width, height);
      
      // Get current date and time
      const currentTime = new Date();
      const timeString = currentTime.toLocaleTimeString();
      const dateString = `${currentTime.getDate()}.${currentTime.getMonth() + 1}.${currentTime.getFullYear()}`;
      
      // Draw time
      context.fillStyle = 'white';

      if (!now) {
        context.font = '110px MonoFonto';
        context.textAlign = 'left';
        context.textBaseline = 'top';
        const [hour, minute, period] = timeString.split(/[: ]/);
        const Hour = parseInt(hour) < 10 ? `0${hour}` : hour;
        context.fillText(Hour, 135, 90);
        context.fillText(minute, 135, 185);
        const pm = parseInt(hour) < 12 ? 'PM' : 'AM';
        context.font = '32px MonoFonto';
        context.fillText(pm, 170, 300);

        // Draw date
        context.font = '28px MonoFonto';
        context.fillText(dateString, 20, 400 - 40);

        // Draw edition
        const edition = options.edition < 10 ? `0${options.edition}` : options.edition;
        context.fillText(`${edition}/17`, 310, 400 - 40);

        // Draw sid
        context.fillText(`S#ID: ${options.sid}`, 20, 20);
      }else{
        context.font = '140px MonoFonto';
        context.textAlign = 'center';
        context.fillText("NOW", width / 2, height / 2 + 20);
      }
    };
    
    // Initial draw
    updateCanvas();
    
    // Create texture from canvas
    const texture = new CanvasTexture(canvas);
    
    // Set up animation loop to update texture
    const animate = () => {
      updateCanvas();
      texture.needsUpdate = true;
      requestAnimationFrame(animate);
    };
    
    // Start animation loop
    animate();
    
    return texture;
  };
  
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    try {
      // Create our dynamic texture with date and time
      let texture: Texture | null = null;

      if(showTime){
        texture = createDateTimeTexture(400, 400, {
          edition: active + 1,
          sid: "12345678",
          padding: 20
        });
      }
      else{
        texture = new TextureLoader().load(`/projects/${active+1}/sc_1.png`);
      }

      if (texture) {
        // Configure texture properties
        texture.center = new Vector2(0.5, 0.5);
        texture.repeat.set(-1, 1);
        texture.wrapS = texture.wrapT = RepeatWrapping;
        
        setScreenTexture(texture);
        
        // Find the screen material and the Watchy object
        scene.traverse((node: any) => {
          // Find the Watchy object
          if (node.name === 'Watchy') {
            setWatchyObj(node);
          }
          
          if (node.isMesh && node.material) {
            // Check if it's a single material or an array
            const materials = Array.isArray(node.material) ? node.material : [node.material];
            
            materials.forEach((material: Material) => {
              // Type guard to ensure it's the correct material type before accessing specific props
              if (material instanceof MeshStandardMaterial && material.name === 'screen.001') {
                material.map = texture;
                material.color = new Color(lightColor);
                material.emissiveMap = texture;
                material.emissive = new Color(lightColor);
                material.emissiveIntensity = 1.0;
                material.needsUpdate = true;
              }
            });
          }
        });
      }
    } catch (error) {
      console.error("Error creating texture:", error);
    }
    
    // Cleanup function
    return () => {
      if (screenTexture) {
        screenTexture.dispose();
      }
    };
  }, [scene, active, showTime, fontLoaded, now]);
  
  useFrame((state, delta) => {
    // Use internalRef here as it's guaranteed to be a RefObject
    if (internalRef.current) {
      // Optional: Add some gentle rotation animation
      // internalRef.current.rotation.y += delta * 0.2;
    }
  });

  const handleWatchyClick = (event: ThreeEvent<MouseEvent>) => {

    if (event.object.name === 'Watchy_2'){
      event.stopPropagation(); 
      setShowTime(!showTime);
      // update seed to current time
      const rnd = Math.random();
      if (rnd < 0.3) { // Use rnd instead of Math.random() for consistency
        setNow(true);
      } else {
        setNow(false);
      }
    }
  };

  return (
    // Pass the correct ref type and cast props to AnimatedGroupProps to resolve complex type conflicts
    <animated.group 
      ref={groupRef} 
      // Use 'as any' to bypass complex type checking for spread props from react-spring/fiber
      {...props as any} 
    >
      <primitive 
        object={scene} 
        scale={1.0} // Internal scale, the group controls the overall scale via props
        onClick={handleWatchyClick}
        onPointerMissed={(e: ThreeEvent<PointerEvent>) => e.stopPropagation()}
      />
    </animated.group>
  );
});

Watchy.displayName = 'Watchy'; // Add display name for DevTools

// Preload the model
useGLTF.preload('/models/watchy.glb');

export default Watchy;
