export const contact = {
  email: "solimanyassin@gmail.com",
  github: "https://github.com/yassinsolim",
  linkedin: "https://linkedin.com/in/yassinsoliman",
  location: "Calgary, AB",
  name: "Yassin Soliman",
  phone: "403-671-2013",
  summary:
    "Builder focused on full-stack products, embedded control, and computer vision systems that bridge hardware and the web.",
  tagline: "Software Engineering @ University of Calgary (Schulich)",
};

export const projects = [
  {
    highlights: [
      "Leading v3 of a telesurgery-ready robotic arm: moving from servos to steppers, TCP instead of UDP, plus safety interlocks for surgeon + patient.",
      "Coordinating a two-Arduino UNO R4 wireless stack (controller + arm mover) that can operate room-to-room today and over sat/cell links in space.",
      "Building the showcase site in Next.js/TypeScript/Tailwind and steering an 8-person software team through hardware iterations and QA.",
    ],
    name: "Waybionic",
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
      "ESP32-CAM + YOLOv8n people counting at crosswalks; publishes congestion to AWS and renders live radar on a Next.js dashboard.",
      "Arduino R4 kiosk with joystick + 16x2 LCD to report hazards (potholes, ice, fallen signs) and auto-activate crosswalk LEDs.",
      "Full stack: AWS ingest + DynamoDB/SNS, React/TS frontend, real-time map overlays, and telemetry sent from embedded nodes.",
    ],
    name: "PathGuard",
    tech: [
      "Arduino",
      "AWS",
      "DynamoDB",
      "ESP32-CAM",
      "Next.js",
      "TypeScript",
      "YOLOv8",
    ],
    timeline: "HackTheChange 2025",
  },
  {
    highlights: [
      "Built a bilingual disaster response GUI with victim, supply, inquiry, and location tracking to coordinate responders.",
      "Java Swing UI backed by PostgreSQL; over a dozen JUnit test cases for reliability and grading.",
      "Supports French translations via externalized XML for accessibility.",
    ],
    name: "DisasterManagementGUI",
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
    tech: ["Django", "JavaScript", "MySQL", "HTML/CSS"],
    timeline: "CalgaryHacks 2025",
  },
  {
    highlights: [
      "MicroPython on a Pi Pico drives a two-digit NeoPixel 7-seg display showing live stock + weather data.",
      "LCD provides secondary stats; button toggles between stock and weather modes.",
      "API fetcher normalizes metrics for compact LED rendering.",
    ],
    name: "Weather-Stock-Data",
    tech: ["MicroPython", "Raspberry Pi Pico", "NeoPixel", "REST APIs"],
    timeline: "2024",
  },
  {
    highlights: [
      "Terminal-based Spotify data explorer that reads CSV dumps and plots BPM, energy, danceability, and more.",
      "Compares features across tracks and visualizes distributions via CLI workflows.",
    ],
    name: "Spotify-Statistics",
    tech: ["Python", "CSV", "Matplotlib"],
    timeline: "2020 data, refreshed tooling",
  },
];

export const experience = [
  {
    company: "Waybionic",
    highlights: [
      "Led control software for a robotic bionic arm, programming motion control in C/C++ and Arduino for precise movement.",
      "Integrated sensors, actuators, and real-time embedded algorithms; built a Next.js/TypeScript site to showcase the project.",
      "Guided an 8-person cross-functional team through Agile sprints and code reviews, boosting productivity by 40%.",
    ],
    role: "Club Software Lead",
    tech: ["Arduino", "C", "C++", "Next.js", "TailwindCSS", "TypeScript"],
    timeline: "Nov 2024 - Present",
  },
  {
    company: "Little Footprints",
    highlights: [
      "Developed fintech sites with JavaScript/HTML/CSS and REST APIs, increasing sales by 30%.",
      "Drove data-backed social media strategies that lifted engagement by 70%.",
      "Improved frontend performance and SEO, enabling 50% more users to land and convert.",
    ],
    role: "Full Stack Web Developer",
    tech: ["CSS", "HTML", "JavaScript", "REST APIs"],
    timeline: "May 2024 - May 2025",
  },
  {
    company: "Code Ninjas",
    highlights: [
      "Taught programming and data structures with game-based projects, increasing student engagement by 75%.",
      "Coached 160+ students through iterative challenges, improving confidence and troubleshooting skills by 30%.",
    ],
    role: "Programming Instructor",
    tech: ["Curriculum Design", "Data Structures", "Python"],
    timeline: "Jul 2023 - Sept 2023",
  },
];

export const education = {
  coursework: [
    "Computer Architecture & Organization",
    "Databases",
    "Embedded Systems",
    "Machine Learning & Deep Learning",
    "Networks",
    "OOP & Data Structures",
    "Operating Systems",
    "Software Design",
  ],
  school: "Schulich School of Engineering (University of Calgary)",
  timeline: "B.Sc. Software Engineering - Expected Apr 2028",
};

export const skills = {
  frameworks: [
    "AngularJS",
    "Bootstrap",
    "Django",
    "Golang",
    "JUnit",
    "Next.js",
    "Node.js",
    "React",
    "Swing",
    "TensorFlow",
  ],
  languages: [
    "Arduino",
    "C",
    "C++",
    "CSS",
    "Cython",
    "HTML",
    "Java",
    "JavaScript",
    "Python",
    "SQL",
    "TailwindCSS",
    "TypeScript",
  ],
  tools: [
    "CI/CD",
    "Docker",
    "Git/GitHub",
    "IntelliJ",
    "Kubernetes",
    "Linux/Unix",
    "PyCharm",
    "SSH",
    "VMware/VirtualBox/UTM",
    "Visual Studio Code",
    "Windows",
    "Xcode",
    "macOS",
  ],
};
