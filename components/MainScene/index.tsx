"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Mesh } from "three";
import * as THREE from "three";

import css from "./MainScene.module.css";
import { Button } from "@mantine/core";
import {FrameIcon, HomeIcon, PauseIcon, PlayIcon, StopIcon} from "@radix-ui/react-icons";

// Define a type for the particle for better type checking
type Particle = {
  x: number;
  y: number;
  z: number;
};

export function useParticles() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Fetch the positions file
    fetch("/data/position.txt")
      .then((response) => response.text())
      .then((text) => {
        // Parse the text to create particles
        const loadedParticles = text.split("\n").map((line) => {
          const [x, y, z] = line.split("\t").map(Number);
          return { x, y, z };
        });
        setParticles(loadedParticles);
      })
      .catch((error) => console.error("Failed to load particle data:", error));
  }, []);

  return particles;
}

function useVideoTexture(
  videoURL: string,
  videoWidth: number,
  videoHeight: number,
) {
  const videoRef = useRef<HTMLVideoElement>();
  const textureRef = useRef<THREE.Texture>();

  useEffect(() => {
    const video = document.createElement("video");
    video.src = videoURL;
    video.width = videoWidth;
    video.height = videoHeight;
    video.loop = true;
    video.muted = false;
    video.play();
    videoRef.current = video;

    const texture = new THREE.VideoTexture(video);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.format = THREE.RGBFormat;
    textureRef.current = texture;

    return () => {
      video.pause();
      texture.dispose();
    };
  }, [videoURL, videoWidth, videoHeight]);

  return textureRef;
}

const vertexShader = `
  attribute float emission;
  varying float vEmission;
  void main() {
    vEmission = emission;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  varying float vEmission;
  void main() {
    vec3 color = vec3(1.0, 0.5, 0.0); // Base color (orange)
    gl_FragColor = vec4(color * vEmission, 1.0);
  }`;

interface MeshComponentProps {
  isStarted?: boolean;
}

function MeshComponent({ isStarted, isPaused }: MeshComponentProps) {
  return isStarted ? <Points isPaused={isPaused} /> : null;
}

function Structure({ isWireframe = false }: { isWireframe: boolean }) {
  const fileUrl = "/data/riverie.glb";
  const mesh = useRef<Mesh>(null!);
  const gltf = useLoader(GLTFLoader, fileUrl);

  function findAllMeshes(
    object: THREE.Object3D,
    meshes: THREE.Mesh[] = [],
  ): THREE.Mesh[] {
    if (object instanceof THREE.Mesh) {
      meshes.push(object);
    }
    object.children.forEach((child) => findAllMeshes(child, meshes));
    return meshes;
  }

  // get the material
  //   const material = gltf.scene.children[0].children[0].children[0].material;

  // pillars
  // gltf.scene.children[0].children[0].children[0].material.wireframe = true;
  // gltf.scene.children[0].children[0].children[0].material.emissive = new THREE.Color(0x505050);

  // find all the meshes and set the wireframe

  useEffect(() => {
    if (isWireframe) {
      if (gltf && gltf.scene) {
        const allMeshes = findAllMeshes(gltf.scene);
        allMeshes.forEach((mesh) => {
          mesh.material.wireframe = true;
          mesh.material.emissive = new THREE.Color(0x202020);
        });
      }
    } else {
      if (gltf && gltf.scene) {
        const allMeshes = findAllMeshes(gltf.scene);
        allMeshes.forEach((mesh) => {
          mesh.material.wireframe = false;
          mesh.material.emissive = new THREE.Color(0x000000);
        });
      }
    }
  }, [isWireframe]);

  return (
    <mesh ref={mesh} scale={100}>
      <primitive object={gltf.scene} />
    </mesh>
  );
}

function Points({ isPaused }: { isPaused: boolean }) {
  const mesh = useRef();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement("canvas"));
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const particlesPos = useParticles();
  const count = particlesPos.length;
  const scale = 0.03;

  const colorArray = useMemo(() => new Float32Array(count * 3), [count]);
  const emissionArray = useMemo(() => new Float32Array(count), [count]);

  useEffect(() => {
    const video = document.createElement("video");
    video.src = "/data/light1.mp4";
    video.width = 50;
    video.height = 42;
    video.loop = false;
    video.muted = false;
    video.volume = 1.0;
    video
      .play()
      .then(() => setIsVideoPlaying(true))
      .catch((e) => console.error("Video play error:", e));
    videoRef.current = video;

    // Set up canvas
    canvasRef.current.width = 50;
    canvasRef.current.height = 42;

    return () => {
      video.pause();
    };
  }, []);

  useEffect(() => {
    if (isPaused) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  }, [isPaused]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      // read particle position
      const { x, y, z } = particlesPos[i];
      temp.push({ x, y, z });
    }
    return temp;
  }, [count]);

  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      vertexColors: true,
    });
  }, []);

  useFrame((state) => {
    if (!isVideoPlaying || !videoRef.current || !mesh.current) return;

    const context = canvasRef.current.getContext("2d");
    context.drawImage(videoRef.current, 0, 0, 50, 42);
    const imageData = context.getImageData(0, 0, 50, 42).data;

    //  convert to one dimensional array
    const data = new Uint8ClampedArray(50 * 42);
    // get only the red channel
    for (let i = 0; i < 50 * 42; i++) {
      data[i] = imageData[i * 4];
    }

    // console.log(data);

    particles.forEach((particle, i) => {
      const color = data[i] / 20 + 0.05;
      const i3 = i * 3;

      colorArray[i3] = color;
      colorArray[i3 + 1] = color;
      colorArray[i3 + 2] = color;

      emissionArray[i] = color;

      // console.log(color, particle.x, particle.y, particle.z)

      // @ts-ignore
      dummy.position.set(particle.x, particle.y, particle.z);
      dummy.updateMatrix();
      // @ts-ignore
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    // @ts-ignore
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.geometry.setAttribute(
      "color",
      new THREE.InstancedBufferAttribute(colorArray, 3),
    );
    mesh.current.geometry.setAttribute(
      "emission",
      new THREE.InstancedBufferAttribute(colorArray, 1),
    );
  });

  return (
    <>
      <instancedMesh
        ref={mesh}
        args={[null, null, count]}
        material={shaderMaterial}
      >
        <sphereGeometry args={[scale, 8, 8]}>
          <instancedBufferAttribute
            attach="attributes-emission"
            args={[emissionArray, 1]}
          />
        </sphereGeometry>
        {/*<meshStandardMaterial color="#000000" />*/}
        <meshPhongMaterial vertexColors />
      </instancedMesh>
    </>
  );
}

export function MainScene() {
  const [isLoading, setIsLoading] = useState(true);
  const [isStarted, setIsStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isWireframe, setIsWireframe] = useState(false);
  const [isStructure, setIsStructure] = useState(true);

  useEffect(() => {
    const video = document.createElement("video");
    video.src = "/data/light1.mp4";
    video.onloadeddata = () => {
      setIsLoading(false);
    };
    video.load();
  }, []);

  const handlePlay = () => {
    if (isStarted) {
      setIsPaused(!isPaused);
    } else {
      setIsStarted(true);
      setIsPaused(false);
    }
  };

  return (
    <div className={css.container}>
      {isLoading && <div className="loader">Loading...</div>}
      <Canvas camera={{ position: [0, 0, 10] }}
        style={{
          width: "100vw",
          height: "100vh",
          position: "absolute",
          top: 0,
          left: 0,
          backgroundColor: "#09090f",
        }}
      >
        <ambientLight intensity={0.15} />
        <pointLight position={[0, 2, 0]} intensity={0.5} />
        <pointLight position={[0, 0, 0]} intensity={0.5} />
        <pointLight position={[0, -2, 0]} intensity={0.5} />
        <OrbitControls />
        <MeshComponent isStarted={isStarted} isPaused={isPaused} />
        {isStructure && <Structure isWireframe={isWireframe} />}
      </Canvas>
      {!isLoading && (
        <>
          <Button
            onClick={() => handlePlay()}
            style={{ position: "absolute", bottom: 20, right: 20 }}
          >
            {isStarted & !isPaused ? <PauseIcon /> : <PlayIcon />}
          </Button>
          <Button
            onClick={() => setIsStarted(false)}
            style={{ position: "absolute", bottom: 20, right: 90 }}
          >
            <StopIcon />
          </Button>
          <Button
            onClick={() => setIsStructure(!isStructure)}
            style={{ position: "absolute", bottom: 20, right: 230 }}
          >
            <HomeIcon />
          </Button>
          <Button
            onClick={() => setIsWireframe(!isWireframe)}
            style={{ position: "absolute", bottom: 20, right: 160 }}
          >
            <FrameIcon />
          </Button>
        </>
      )}
    </div>
  );
}
