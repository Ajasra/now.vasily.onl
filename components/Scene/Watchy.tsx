import React, { useRef, useEffect, useState, use } from 'react';
import { useFrame } from '@react-three/fiber';
import { Texture, useGLTF } from '@react-three/drei';
import { Group, RepeatWrapping, Vector2, CanvasTexture, TextureLoader, Color, Object3D } from 'three';

const lightColor = new Color('#FFCA88'); // Brighter color

// Watchy model component
const Watchy = (props: any) => {
  const groupRef = useRef<Group>(null!);
  const { scene } = useGLTF('/models/watchy.glb');
  const [screenTexture, setScreenTexture] = useState<CanvasTexture | null>(null);
  const [watchyObj, setWatchyObj] = useState<Object3D | null>(null);
  const [showTime, setShowTime] = useState(false);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [now, setNow] = useState(false);

  const [project, setProject] = useState(null);
  const [description, setDescription] = useState("");

  const { active } = props;
  
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
        context.textBaseline = 'center';
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
            
            materials.forEach(material => {
              if (material.name === 'screen.001') {
                material.map = texture;
                material.color = new Color(lightColor);
                material.emissiveMap = texture;
                material.emissive = new Color(lightColor);
                material.emissiveIntensity = 1.0; // Full emission strength
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
    if (groupRef.current) {
      // Optional: Add some gentle rotation animation
      // groupRef.current.rotation.y += delta * 0.2;
    }
  });

  const handleWatchyClick = (event: any) => {

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
    <group ref={groupRef} {...props}>
      <primitive 
        object={scene} 
        scale={1.0} 
        onClick={handleWatchyClick}
        onPointerMissed={(e) => e.stopPropagation()}
      />
    </group>
  );
};

// Preload the model
useGLTF.preload('/models/watchy.glb');

export default Watchy;
