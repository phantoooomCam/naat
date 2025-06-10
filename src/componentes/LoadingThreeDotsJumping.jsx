"use client";
import { motion } from "framer-motion";

function LoadingThreeDotsJumping() {
  const dotVariants = {
    jump: {
      y: -30,
      transition: {
        duration: 0.8,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "easeInOut",
      },
    },
  };

  return (
    <motion.div
      animate="jump"
      transition={{ staggerChildren: -0.2, staggerDirection: -1 }}
      className="container"
    >
      <motion.div className="dot" variants={dotVariants} />
      <motion.div className="dot" variants={dotVariants} />
      <motion.div className="dot" variants={dotVariants} />
      <StyleSheet />
    </motion.div>
  );
}

function StyleSheet() {
  return (
    <style>
      {`
            .container {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                gap: 10px;
            }

            .dot {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background-color: #222a35;
                will-change: transform;
            }
            `}
    </style>
  );
}

export default LoadingThreeDotsJumping;
