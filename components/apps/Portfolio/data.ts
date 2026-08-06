export const contact = {
  email: "solimanyassin@gmail.com",
  github: "https://github.com/yassinsolim",
  linkedin: "https://linkedin.com/in/yassinsoliman",
  location: "Calgary, AB",
  name: "Yassin Soliman",
  phone: "403-671-2013",
  site: "https://yassin.app",
  summary:
    "Software engineer focused on GPU-accelerated deep learning libraries, neural network performance, and practical systems that connect low-level optimization with product-grade software.",
  tagline:
    "AI GPU Software Libraries Intern @ AMD | \n Software Engineering @ University of Calgary",
};

export const snapshot = {
  facts: [
    { label: "Based in", value: "Calgary, AB" },
    { label: "Studying", value: "B.Sc. Software Engineering, UCalgary" },
    { label: "Graduating", value: "April 2028" },
    { label: "Focus", value: "GPU libraries, deep learning, systems" },
  ],
  text: "Working on HIPDNN and MIOpen heuristics at AMD, with a focus on deep learning software, deep neural network performance, and GPU library workflows.",
};

export const projects = [
  {
    highlights: [
      "Designed an interactive, OS-style personal portfolio with draggable windows and app-like navigation using Next.js, React, TypeScript, TailwindCSS, and Three.js to showcase projects and experience.",
      "Containerized the application with Docker and deployed it on a self-hosted Proxmox VE homelab, achieving reliable uptime and responsive performance without relying on third-party PaaS.",
      "Implemented GitHub-driven CI/CD workflows to automatically build, test, and deploy changes on push, enabling rapid experimentation with minimal downtime.",
    ],
    name: "yassin.app",
    repo: "https://github.com/yassinsolim/yassinOS",
    site: "https://yassin.app",
    summary:
      "OS-style personal portfolio with draggable windows, self-hosted on a Proxmox homelab.",
    tech: [
      "Next.js",
      "React",
      "TypeScript",
      "TailwindCSS",
      "Three.js",
      "Docker",
      "Proxmox VE",
    ],
    timeline: "Dec 2025",
  },
  {
    highlights: [
      "Self-supervised neural audio encoder trained on 106,000 songs, lifting genre-probe accuracy from 0.25 to 0.641 as the training set scaled from 475 to 106k tracks.",
      "Blends offline audio-feature similarity, a DSP engine measured straight from the waveform, and a vibe engine that matches bass profile and dynamics instead of relying on the locked-down Spotify feature API.",
      "Ships a CLI, a local web app, a numpy-only hosted deployment over a 273k-track library, and a Spicetify extension that adds a right-click \u201CFind soundalikes\u201D menu inside Spotify.",
    ],
    name: "soundalike",
    repo: "https://github.com/yassinsolim/soundalike",
    site: "https://soundalike.yassin.app",
    summary:
      "Open-source music recommender that matches songs by timbre and vibe rather than tags.",
    tech: [
      "Python",
      "PyTorch",
      "NumPy",
      "Self-Supervised Learning",
      "DSP",
      "Vercel",
    ],
    timeline: "2026",
  },
  {
    highlights: [
      "Account-free, privacy-first navigation for Calgary built on OpenStreetMap-derived data, MapLibre, and Valhalla, with no tracking accounts and on-device storage for saved places.",
      "Expo/React Native iOS client backed by a native Swift navigation core handling route ownership, course matching, rerouting, spoken guidance, arrival hysteresis, and CarPlay.",
      "Strict TypeScript pnpm/Turbo monorepo with shared Zod contracts, a Fastify API over self-hosted Nominatim and Valhalla, and a 17-variant Calgary route regression matrix.",
    ],
    name: "NavOSS",
    repo: "https://github.com/yassinsolim/NavOSS",
    site: "https://navoss.yassin.app",
    summary:
      "Privacy-first, account-free navigation for Calgary, currently in iOS technical beta.",
    tech: [
      "TypeScript",
      "Expo",
      "React Native",
      "Swift",
      "Fastify",
      "MapLibre",
      "Valhalla",
    ],
    timeline: "2026",
  },
  {
    highlights: [
      "Source-style kinematic movement controller running a fixed 128 Hz simulation with surf, ground, and air handling, ramp clipping, and slide movement.",
      "Map manifest system with BVH collision against static triangle meshes, plus a separate render scene and camera for the first-person viewmodel pipeline.",
      "Run timer with finish detection, online leaderboard submission, and multiplayer presence with remote player models.",
    ],
    name: "WebStrafe",
    repo: "https://github.com/yassinsolim/WebStrafe",
    site: "https://strafe.yassin.app",
    summary:
      "Browser Three.js surf sandbox chasing CS:GO bhop and surf movement feel.",
    tech: ["TypeScript", "Three.js", "Vite", "WebSockets", "BVH Collision"],
    timeline: "2026",
  },
  {
    highlights: [
      "Leading v3 of a telesurgery robotic arm: moving from servos to steppers, TCP instead of UDP, plus safety interlocks for surgeon and patient.",
      "Coordinating a two-Arduino UNO R4 wireless stack (controller + arm mover) that can operate room-to-room today and eventually over sat/cell links.",
      "Building the showcase site in Next.js/TypeScript/Tailwind and steering an 8-person software team through hardware iterations and QA.",
    ],
    name: "Waybionic",
    repo: "https://github.com/Waybionic",
    site: "https://waybionic.com",
    summary:
      "Telesurgery robotic arm control stack and showcase site for the UCalgary Waybionic club.",
    tech: [
      "Arduino",
      "C/C++",
      "Next.js",
      "TailwindCSS",
      "TCP/IP",
      "Stepper Control",
    ],
    timeline: "Ongoing",
  },
  {
    highlights: [
      "Built a crosswalk safety prototype combining an ESP32-CAM people-counting node, an Arduino UNO R4 WiFi hazard kiosk, and an AWS backend to surface real-time pedestrian congestion and hazards on a map.",
      "Implemented a YOLOv8n + ByteTrack pipeline to detect and track pedestrians from an MJPEG stream, computing 5-minute rolling averages and publishing compact \u201Clow/med/high\u201D congestion records to an ingest API.",
      "Programmed a joystick-driven LCD UI and ultrasonic pedestrian detector with 9 hazard categories, sending structured self-report events to DynamoDB and triggering SNS email alerts.",
    ],
    name: "PathGuard",
    repo: "https://github.com/JAYMA-Hacks/PathGuard",
    site: "https://path-guard.vercel.app/home",
    summary:
      "Crosswalk safety prototype pairing embedded hazard reporting with a live congestion map.",
    tech: [
      "Python",
      "YOLOv8",
      "ESP32-CAM",
      "Arduino",
      "AWS",
      "React",
      "TypeScript",
    ],
    timeline: "Nov 2025 - HackTheChange",
  },
  {
    highlights: [
      "Browser arcade-sim racing engine with custom vehicle physics tuned for the Nordschleife.",
      "Real-time multiplayer plus ghost replays for solo time attack.",
      "Built in TypeScript and Three.js and embedded into the 3D personal site.",
    ],
    name: "Nordschleife Racer",
    repo: "https://github.com/yassinsolim/nordschleife-racer",
    site: "https://yassin.app",
    summary:
      "Arcade-sim racing engine with custom physics, multiplayer, and ghost replays.",
    tech: ["TypeScript", "Three.js", "WebSockets", "Vehicle Physics"],
    timeline: "2026",
  },
  {
    highlights: [
      "AI-powered coach that runs behavioural and technical interview prep sessions.",
      "Generates follow-up questions and structured feedback from a candidate's answers.",
    ],
    name: "InterviewCoach",
    repo: "https://github.com/yassinsolim/InterviewCoach",
    summary:
      "AI coach for practising behavioural and technical interview questions.",
    tech: ["JavaScript", "LLM APIs", "Node.js"],
    timeline: "2026",
  },
  {
    highlights: [
      "Built a bilingual disaster response GUI with victim, supply, inquiry, and location tracking to coordinate responders.",
      "Java Swing UI backed by PostgreSQL, with over a dozen JUnit test cases for reliability.",
      "Supports French translations via externalized XML for accessibility.",
    ],
    name: "DisasterManagementGUI",
    repo: "https://github.com/yassinsolim/DisasterManagementGUI",
    summary:
      "Bilingual Java disaster-response GUI for coordinating victims, supplies, and inquiries.",
    tech: ["Java", "JUnit", "PostgreSQL", "Swing"],
    timeline: "Mar 2025",
  },
  {
    highlights: [
      "Community forum for newcomers to Calgary with real-time and private messaging plus a finance tracker.",
      "Profiles with avatars/bios, posting/liking, search + filters, and JS polling for live updates.",
      "Django + MySQL backend; JavaScript front-end for chat and dashboards.",
    ],
    name: "CalgaryConnect",
    summary:
      "Community forum and finance tracker for newcomers settling in Calgary.",
    tech: ["Django", "JavaScript", "MySQL", "HTML/CSS"],
    timeline: "CalgaryHacks 2025",
  },
  {
    highlights: [
      "MicroPython on a Pi Pico drives a two-digit NeoPixel 7-segment display showing live stock and weather data.",
      "LCD provides secondary stats; a button toggles between stock and weather modes.",
      "API fetcher normalizes metrics for compact LED rendering.",
    ],
    name: "Weather-Stock-Data",
    repo: "https://github.com/yassinsolim/weather-stock-data",
    summary:
      "Pi Pico display that renders live stock and weather data on NeoPixel 7-segments.",
    tech: ["MicroPython", "Raspberry Pi Pico", "NeoPixel", "REST APIs"],
    timeline: "2024",
  },
  {
    highlights: [
      "Terminal-based Spotify data explorer that reads CSV dumps and plots BPM, energy, danceability, and more.",
      "Compares features across tracks and visualizes distributions via CLI workflows.",
      "First-year project that later grew into the soundalike recommender.",
    ],
    name: "Spotify-Statistics",
    summary:
      "Terminal Spotify data explorer for BPM, energy, and danceability distributions.",
    tech: ["Python", "CSV", "Matplotlib"],
    timeline: "2020 data, refreshed tooling",
  },
];

export const experience = [
  {
    company: "AMD",
    highlights: [
      "Joining the AGS Libraries group to work on GPU-accelerated math and communication libraries within AMD\u2019s open-source ROCm software platform.",
      "Will contribute to feature and API development, testing, and debugging for performance-critical AI and high-performance computing workloads on modern AMD GPUs.",
      "Expected to deepen experience in GPU programming, Linux-based development, open-source workflows, and performance-oriented software engineering using C++, HIP, and Python.",
    ],
    location: "Markham, ON",
    role: "AGS Libraries Intern",
    tech: ["ROCm", "HIP", "C++", "Python", "Linux", "GPU Programming"],
    timeline: "May 2026 - Apr 2027",
  },
  {
    company: "Waybionic Club",
    highlights: [
      "Led development of control systems for a robotic surgical arm, programming in C, C++, and Arduino to achieve precise and reliable motion control.",
      "Integrated sensors, actuators, and real-time embedded algorithms, ensuring responsive performance of robotic components; additionally developed a Next.js/TypeScript website to showcase and document the project.",
      "Directed a cross-functional team of 8 engineers through Agile sprints and code reviews, improving productivity by 40%.",
    ],
    location: "Calgary, AB",
    role: "Software Lead",
    tech: [
      "Arduino",
      "C",
      "C++",
      "Next.js",
      "TypeScript",
      "TailwindCSS",
      "Agile",
    ],
    timeline: "Nov 2024 - Present",
  },
  {
    company: "Little Footprints",
    highlights: [
      "Developed fintech websites using JavaScript, HTML, and CSS with REST API integration, boosting sales by 30%.",
      "Administered data-driven social media strategies, increasing engagement by 70%.",
      "Enhanced frontend performance and SEO through web traffic analysis and SSL integration, enabling 50% more users to visit.",
      "Collaborated in Agile workflows with 2 software engineers, refining iterative solutions and communication.",
    ],
    location: "Calgary, AB",
    role: "Software Engineer",
    tech: ["JavaScript", "HTML", "CSS", "REST APIs", "Agile"],
    timeline: "May 2024 - May 2025",
  },
  {
    company: "Code Ninjas",
    highlights: [
      "Taught core programming and data structures concepts using interactive games and robotics projects, expanding student engagement by 75%.",
      "Guided 160+ students through software development challenges and iteratively refined curriculum based on feedback, boosting coding confidence and troubleshooting skills by 30%.",
    ],
    location: "Calgary, AB",
    role: "Programming Instructor",
    tech: [
      "Python",
      "Data Structures",
      "Cryptography",
      "Curriculum Design",
      "Robotics",
    ],
    timeline: "Jul 2023 - Sept 2023",
  },
];

export const education = {
  coursework: [
    "Operating Systems",
    "Computer Architecture & Organization",
    "Databases",
    "Digital Circuits",
    "Embedded Systems",
    "Full-stack Web Development",
    "Networks",
    "Object-Oriented Programming",
    "Data Structures & Algorithms",
    "Software Design",
    "Software Architecture",
    "Statistics",
    "Machine Learning & Deep Learning",
    "Testing",
  ],
  degree: "Bachelor of Science in Software Engineering",
  location: "Calgary, AB",
  school: "Schulich School of Engineering (University of Calgary)",
  timeline: "Expected April 2028",
};

export const skills = {
  frameworks: [
    "React",
    "Next.js",
    "Three.js",
    "JUnit",
    "Swing",
    "Django",
    "Node.js",
    "NumPy",
    "OpenCV",
    "Ultralytics YOLOv8",
    "supervision (ByteTrack)",
    "AWS (API Gateway, Lambda, DynamoDB, SNS)",
    "CI/CD",
  ],
  languages: [
    "C",
    "C++",
    "Python",
    "Java",
    "SQL (MySQL)",
    "JavaScript",
    "HTML5",
    "CSS",
    "TypeScript",
    "TailwindCSS",
    "Arduino",
  ],
  tools: [
    "Git/GitHub",
    "GitHub Workflows",
    "Atlassian/Jira",
    "Docker",
    "Kubernetes",
    "Proxmox VE",
    "TrueNAS",
    "Tailscale",
    "Linux/Unix",
    "Shell Scripting",
    "SSH",
    "VMWare Fusion",
    "VirtualBox",
    "UTM",
    "Visual Studio Code",
    "PyCharm",
    "IntelliJ",
    "Xcode",
    "MPLAB X IDE",
    "AutoCAD",
    "macOS",
    "Windows 11",
  ],
};
