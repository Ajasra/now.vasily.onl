import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { CanvasTexture, Texture, TextureLoader, RepeatWrapping, Vector2, Color } from 'three';

interface UseWatchScreenTextureProps {
    active: number;
    showTime: boolean;
    fontLoaded: boolean;
    width?: number;
    height?: number;
    options?: {
        padding: number;
        edition: number;
        sid: string;
    };
}

// Default options matching the original component
const defaultOptions = {
    padding: 20,
    edition: 1, // This will be updated via props
    sid: "12345678"
};

const lightColor = new Color('#FFCA88'); // Reuse the color definition

export const useWatchScreenTexture = ({
    active,
    showTime,
    fontLoaded,
    width = 400,
    height = 400,
    options: propOptions // Rename to avoid conflict
}: UseWatchScreenTextureProps): [CanvasTexture | Texture | null, boolean, () => void] => {

    const [screenTexture, setScreenTexture] = useState<CanvasTexture | Texture | null>(null);
    const [now, setNow] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const minuteTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastMinuteRef = useRef<number>(-1);
    const staticTextureRef = useRef<Texture | null>(null);
    const textureLoader = useRef<TextureLoader | null>(null);
    const lastActiveRef = useRef<number>(active);
    const isLoadingRef = useRef<boolean>(false);
    
    // Initialize the texture loader once
    if (!textureLoader.current) {
        textureLoader.current = new TextureLoader();
    }

    // Memoize the texture path to prevent unnecessary changes
    const texturePath = useMemo(() => `/projects/${active + 1}/sc_1.png`, [active]);
    
    // Combine default and passed options
    const options = useMemo(() => ({ 
        ...defaultOptions, 
        ...propOptions, 
        edition: active + 1 
    }), [active, propOptions]);

    // Function to update canvas content
    const updateCanvas = useCallback(() => {
        if (!contextRef.current || !canvasRef.current || !fontLoaded) return;

        const context = contextRef.current;
        const canvas = canvasRef.current;
        const currentTime = new Date();
        const currentMinute = currentTime.getMinutes();

        // Only do a full redraw if the minute has changed or it's forced
        const shouldFullRedraw = currentMinute !== lastMinuteRef.current;
        
        if (shouldFullRedraw) {
            lastMinuteRef.current = currentMinute;
            
            // Clear canvas
            context.fillStyle = 'black';
            context.fillRect(0, 0, width, height);

            // Get formatted time
            const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }); // Format for consistency
            const dateString = `${currentTime.getDate()}.${currentTime.getMonth() + 1}.${currentTime.getFullYear()}`;

            // Draw time
            context.fillStyle = 'white';

            if (!now) {
                context.font = '110px MonoFonto'; // Ensure font is loaded via fontLoaded prop
                context.textAlign = 'left';
                context.textBaseline = 'top';
                const [timePart, period] = timeString.split(' ');
                const [hour, minute] = timePart.split(':');

                // Ensure hour is two digits (though toLocaleTimeString often does this)
                const displayHour = hour.padStart(2, '0');

                context.fillText(displayHour, 135, 90);
                context.fillText(minute, 135, 185);
                context.font = '32px MonoFonto';
                context.fillText(period, 170, 300); // Use period from toLocaleTimeString

                // Draw date
                context.font = '28px MonoFonto';
                context.fillText(dateString, 20, height - 40);

                // Draw edition
                const editionText = `${options.edition.toString().padStart(2, '0')}/17`;
                context.fillText(editionText, 310, height - 40);

                // Draw sid
                context.fillText(`S#ID: ${options.sid}`, 20, 20);

            } else {
                context.font = '140px MonoFonto';
                context.textAlign = 'center';
                context.textBaseline = 'middle'; // Center vertically better
                context.fillText("NOW", width / 2, height / 2); // Adjust y-pos slightly
            }

            // Update the texture
            if (screenTexture instanceof CanvasTexture) {
                screenTexture.needsUpdate = true;
            }
        }

    }, [width, height, fontLoaded, now, options.edition, options.sid]); 

    // Setup minute timer that forces updates on the minute
    const setupMinuteTimer = useCallback(() => {
        // Clear existing timer if any
        if (minuteTimerRef.current) {
            clearTimeout(minuteTimerRef.current);
            minuteTimerRef.current = null;
        }
        
        // Calculate ms until the next minute
        const now = new Date();
        const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
        
        // Set timer to update at the exact start of next minute
        minuteTimerRef.current = setTimeout(() => {
            // Force update
            updateCanvas();
            
            // Setup next timer (recursive)
            setupMinuteTimer();
        }, msToNextMinute);
        
    }, [updateCanvas]);

    // Animation loop - runs at 60fps but we only redraw when needed
    const animate = useCallback(() => {
        updateCanvas();
        animationFrameRef.current = requestAnimationFrame(animate);
    }, [updateCanvas]);

    // Handle static texture loading separately to prevent excessive rerenders
    const loadStaticTexture = useCallback(() => {
        if (!textureLoader.current || isLoadingRef.current) return;
        
        // If active has changed or no texture is loaded, load a new one
        if (lastActiveRef.current !== active || !staticTextureRef.current) {
            isLoadingRef.current = true;
            
            textureLoader.current.load(
                texturePath, 
                (tex) => {
                    tex.center = new Vector2(0.5, 0.5);
                    tex.repeat.set(-1, 1);
                    tex.wrapS = tex.wrapT = RepeatWrapping;
                    
                    // Store in ref and update state only once
                    staticTextureRef.current = tex;
                    lastActiveRef.current = active;
                    isLoadingRef.current = false;
                    
                    // Only update state if we're still showing the same mode
                    if (!showTime) {
                        setScreenTexture(tex);
                    }
                },
                undefined, // onProgress not needed
                (error) => {
                    console.error("Error loading texture:", error);
                    isLoadingRef.current = false;
                }
            );
        } else if (!showTime && staticTextureRef.current && screenTexture !== staticTextureRef.current) {
            // Reuse existing texture if available and mode still matches
            setScreenTexture(staticTextureRef.current);
        }
    }, [active, texturePath, showTime]);

    // Effect to handle dynamic texture creation and updates
    useEffect(() => {
        // Only run in browser environment and when font is loaded
        if (typeof document === 'undefined' || !fontLoaded) return;
        
        // Handle canvas texture (time display)
        if (showTime) {
            // Stop any loading of static textures
            isLoadingRef.current = false;
            
            // Cancel animation frame if running
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            
            // Initialize canvas and context if they don't exist
            if (!canvasRef.current) {
                canvasRef.current = document.createElement('canvas');
                canvasRef.current.width = width;
                canvasRef.current.height = height;
                contextRef.current = canvasRef.current.getContext('2d');
            }

            // Create CanvasTexture if it doesn't exist or if it wasn't one before
            if (!(screenTexture instanceof CanvasTexture)) {
                const texture = new CanvasTexture(canvasRef.current);
                texture.center = new Vector2(0.5, 0.5);
                texture.repeat.set(-1, 1);
                texture.wrapS = texture.wrapT = RepeatWrapping;
                setScreenTexture(texture);
            } 

            // Start animation loop if not already running
            if (animationFrameRef.current === null) {
                // Force initial draw
                updateCanvas();
                
                // Set up minute timer for precise minute updates
                setupMinuteTimer();
                
                // Start animation loop (will handle frames between minute changes)
                animate();
            }
        } else {
            // Stop animation loop if running
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            
            // Clear minute timer
            if (minuteTimerRef.current) {
                clearTimeout(minuteTimerRef.current);
                minuteTimerRef.current = null;
            }
            
            // Load static texture
            loadStaticTexture();
        }

        // Cleanup function
        return () => {
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            
            if (minuteTimerRef.current) {
                clearTimeout(minuteTimerRef.current);
                minuteTimerRef.current = null;
            }
        };
    }, [showTime, fontLoaded, width, height, animate, updateCanvas, loadStaticTexture, setupMinuteTimer]);

    // Function to toggle 'now' state, exposed to the component
    const toggleNow = useCallback(() => {
        const rnd = Math.random();
        setNow(rnd < 0.3);
        
        // Force an immediate redraw when toggling
        if (contextRef.current && canvasRef.current) {
            lastMinuteRef.current = -1; // Force redraw by invalidating last minute
            updateCanvas();
        }
    }, [updateCanvas]);

    return [screenTexture, now, toggleNow];
}; 