import React from 'react';
import styles from './spinner.module.css';

export function FullScreenSpinner() {
  return (
    <div className={styles.overlay}>
      <div className={styles.spinner}></div>
    </div>
  );
}
