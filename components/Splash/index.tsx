import React, {useEffect, useRef, useState} from 'react';
import Design from './Design';

interface SplashScreenProps {
  onAnimationFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({onAnimationFinish}) => {
  const defaultProps = {};
  useEffect(() => {
    setTimeout(() => {
      onAnimationFinish();
    }, 3000);
  }, []);
  return <Design {...defaultProps} />;
};

export default SplashScreen;
