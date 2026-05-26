import React from 'react'
import { motion } from 'framer-motion'
import { Bell, User, Flame } from 'lucide-react'

const Navbar = ({ userName = 'User', notificationCount = 4 }) => {
  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
