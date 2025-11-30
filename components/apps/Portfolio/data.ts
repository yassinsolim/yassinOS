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
      "Built a crosswalk safety prototype that links ESP32-CAM people-counting nodes with an Arduino UNO R4 hazard kiosk and an AWS-backed map dashboard.",
      "Implemented a YOLOv8n + ByteTrack pipeline to detect and track pedestrians, publishing rolling congestion signals for real-time visibility.",
      "Designed a joystick-driven LCD UI with nine hazard categories that streams structured events to DynamoDB and triggers SNS alerts.",
    ],
    name: "PathGuard",
    tech: [
      "Arduino",
      "AWS",
      "ESP32-CAM",
      "Python",
      "React",
      "TypeScript",
      "YOLOv8",
    ],
    timeline: "Nov 2025",
  },
  {
    highlights: [
      "Built a bilingual disaster response system with victim, supplies, inquiry, and location tracking modules to increase support capacity.",
      "Implemented Swing UI + PostgreSQL for persistent data handling and reliability.",
      "Applied custom data models and JUnit coverage for a fully passing test suite.",
    ],
    name: "DisasterManagementGUI",
    tech: ["Java", "JUnit", "PostgreSQL", "Swing"],
    timeline: "Mar 2025",
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
