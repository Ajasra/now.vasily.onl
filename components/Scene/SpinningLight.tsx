import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const SpinningLight: React.FC = () => {
  const lightRef1 = useRef<THREE.PointLight>(null);
    const lightRef2 = useRef<THREE.PointLight>(null);
  
  useFrame(({ clock }) => {
    if (lightRef1.current) {
      // Create circular motion around the model for the first light
      const radius = 2;
      const speed = 0.5;
      const time = clock.getElapsedTime() * speed;
      
      lightRef1.current.position.x = Math.sin(time) * radius;
      lightRef1.current.position.z = 2;
      lightRef1.current.position.y = Math.cos(time) * radius; // Some vertical movement
    
    
    }

    if (lightRef2.current) {
      // Create circular motion around the model for the second light
      const radius = 2;
      const speed = 0.5;
      const time = clock.getElapsedTime() * speed;
      
      lightRef2.current.position.x = Math.cos(time) * radius;
      lightRef2.current.position.z = 2;
      lightRef2.current.position.y = -Math.sin(time) * radius; // Some vertical movement
    }
  });
  
  return (
    <group>
        <pointLight ref={lightRef1} intensity={5} color={'#ffffff'} />;
        <pointLight ref={lightRef2} intensity={3} color={'#3333ff'} />;
    </group>
  )
  
};

export default SpinningLight;
