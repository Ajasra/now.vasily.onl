
import { Timeline } from '@mantine/core';
import { Text } from '@mantine/core';
import { title } from 'process';
import React, { useState } from 'react';

import styles from './Timeline.module.css';

const items = [
  {
    title: '#01',
    active: true,
  },
  {
    title: '#02',
    active: true,
  },
  {
    title: '#03',
    active: true,
  },
  {
    title: '...',
    active: false,
  },
  {
    title: '...',
    active: false,
  }
];

interface ModelsTimelineProps {
  active: number;
  setActive: (index: number) => void;
}

export default function ModelsTimeline({ active, setActive }: ModelsTimelineProps) {

  function handleClick(id){
    if (id === active) return;
    if (items[id].active) setActive(id);
  }
  
  return (
    <Timeline 
      active={active} 
      color='dark' 
      // reverseActive 
      lineWidth={1} 
      bulletSize={12} 
      align="right"
      className={styles.timeline}
    >
      {items.map((item, index) => (
        <Timeline.Item 
          title={item.title} 
          key={item.title} 
          className={`${styles.item} ${index === active ? "active" : ''}`} 
          onClick={() => handleClick(index)}
          lineVariant={item.active  ? 'solid' : 'dashed'}
        />
      ))}
    </Timeline>
  );
}