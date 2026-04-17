import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';

const MovingStars = () => {
  const starsRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (starsRef.current) {
      starsRef.current.rotation.x += 0.0001;
      starsRef.current.rotation.y += 0.0001;
    }
  });

  return (
    <group ref={starsRef}>
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
    </group>
  );
};

const IndiaMap = () => {
  // Accurate simplified India path
  const indiaPath = "M163,55 L168,52 L172,55 L180,50 L188,52 L195,45 L205,48 L210,40 L220,45 L230,42 L235,50 L245,55 L255,50 L260,60 L275,65 L285,60 L295,70 L305,75 L315,70 L325,80 L320,95 L310,110 L300,125 L310,140 L325,150 L340,145 L355,155 L360,170 L350,185 L335,190 L320,185 L305,190 L290,205 L280,225 L290,245 L300,265 L310,285 L315,305 L310,325 L300,345 L285,365 L270,385 L255,405 L240,425 L225,445 L215,465 L205,485 L195,505 L185,525 L175,545 L170,565 L165,585 L160,605 L158,625 L155,645 L150,665 L145,685 L145,705 L145,725 L145,745 L148,765 L155,785 L165,805 L175,825 L185,845 L190,865 L192,885 L190,905 L185,920 L175,935 L165,950 L155,965 L145,975 L135,960 L125,945 L115,930 L105,910 L95,890 L85,870 L75,850 L65,830 L55,810 L45,790 L35,770 L25,750 L20,730 L18,710 L20,690 L25,670 L35,650 L45,630 L55,610 L60,590 L60,570 L55,550 L50,530 L45,510 L40,490 L35,470 L30,450 L35,430 L45,410 L55,390 L65,375 L75,360 L85,345 L95,330 L95,310 L90,290 L80,270 L70,250 L60,230 L55,210 L60,190 L70,175 L85,165 L105,160 L125,165 L145,160 L160,145 L170,125 L175,105 L170,85 L163,55 Z";

  const hubs = [
    { x: 175, y: 150, name: 'Delhi' },
    { x: 80, y: 350, name: 'Mumbai' },
    { x: 190, y: 650, name: 'Bangalore' },
    { x: 210, y: 720, name: 'Chennai' },
    { x: 300, y: 250, name: 'Kolkata' },
    { x: 150, y: 450, name: 'Hyderabad' },
  ];

  return (
    <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
      <svg
        viewBox="0 0 400 1000"
        className="h-[80vh] w-auto text-indigo-500 fill-current overflow-visible"
        style={{ filter: 'drop-shadow(0 0 20px rgba(79, 70, 229, 0.4))' }}
      >
        <motion.path
          d={indiaPath}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 4, ease: "easeInOut" }}
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        
        {hubs.map((hub, idx) => (
          <g key={idx}>
            <motion.circle
              cx={hub.x}
              cy={hub.y}
              r="4"
              className="fill-indigo-400"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.5, 1] }}
              transition={{ delay: 2 + idx * 0.2, duration: 1 }}
            />
            <motion.circle
              cx={hub.x}
              cy={hub.y}
              r="12"
              className="stroke-indigo-400/30 fill-none"
              strokeWidth="1"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [1, 3], opacity: [0.5, 0] }}
              transition={{ delay: 2 + idx * 0.2, duration: 2, repeat: Infinity }}
            />
          </g>
        ))}
      </svg>
    </div>
  );
};

export const SpaceBackground: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
  return (
    <div className={`fixed inset-0 z-[-1] transition-colors duration-1000 overflow-hidden pointer-events-none ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
      
      {/* 3D Animated Stars Layer */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${isDarkMode ? 'opacity-100' : 'opacity-0'}`}>
        <Canvas camera={{ position: [0, 0, 1] }}>
          <MovingStars />
        </Canvas>
      </div>

      {/* India Map Animated Layer (Visible in Dark Mode) */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${isDarkMode ? 'opacity-100' : 'opacity-0'}`}>
        <IndiaMap />
      </div>

      {/* Decorative Gradients */}
      <div className={`absolute inset-0 bg-gradient-to-b from-transparent transition-colors duration-1000 ${isDarkMode ? 'to-slate-950/80' : 'to-white/80'}`} />
      
      {/* Light Mode Specific Decorations */}
      {!isDarkMode && (
        <div className="absolute inset-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[100px] opacity-50" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-100 rounded-full blur-[100px] opacity-50" />
        </div>
      )}
    </div>
  );
};
