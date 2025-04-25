import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { NextPage } from 'next';
import Watchy from '../components/Scene/Watchy';
import SpinningLight from '../components/Scene/SpinningLight';
import ModelsTimeline from '../components/UI/Timeline';
import ProjectDescription from '../components/UI/Description';


const Models: NextPage = () => {

  const [active, setActive] = useState(1);
  
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
        <Watchy 
          position={[1.2,-1.2, 0]} 
          scale={0.07} 
          rotation={[3.14/2, 0, 3.14]}
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
      <ProjectDescription active={active} />
      <ModelsTimeline active={active} setActive={setActive} />
    </>
  );
};

export default Models;
