
// This file acts as a bridge to provide environment variables in a browser-only environment.
// Since .env files are not readable by the browser directly without a build step,
// we attach the keys to the global window object.

window.process = window.process || {};
window.process.env = window.process.env || {};

// =================================================================
// 🔴 請在此處填入您的 API KEY / PLEASE PASTE YOUR API KEY BELOW 🔴
// =================================================================
window.process.env.API_KEY = "AIzaSyDuexMhYM6_B9zFeqEPI4BXEofIDmNG8VY"; 
window.process.env.VITE_API_KEY = window.process.env.API_KEY;

console.log("Environment variables loaded from import.js");
