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
  text: "Shipping convolution solvers, kernel-selection databases, and hipDNN heuristics in AMD's MIOpen, co-leading software for Waybionic's robotic surgical arm, and building GPU-heavy projects like AetherVSR and MacMST on the side.",
};

export const projects = [
  {
    highlights: [
      "Real-time neural video upscaler for 720p sources, with an Electron/WebGPU desktop player and an in-progress native macOS player built on Swift, AVFoundation, Core Video, and Metal.",
      "Rewrote the Metal convolution kernels around the GPU's 32 KB threadgroup memory (cooperative halo loads, vector channel groups, output-channel reuse), cutting 720p-to-1440p inference on Apple M5 from 65.9 ms to 3.9 ms p50 (16.8x) with golden-vector parity against the WebGPU path.",
      "Shipped a 6,291-parameter upscaler into a zero-readback WebGPU pipeline at 6.3 ms p50, timed with GPU timestamp queries. A 10-minute 720p60 run held 59.6 fps with 0.88% frame loss, and a runtime controller falls back to a simpler scaler under load and recovers on its own.",
    ],
    name: "AetherVSR",
    repo: "https://github.com/yassinsolim/AetherVSR",
    summary:
      "Local GPU video super-resolution with a WebGPU desktop player and a native Metal path in progress.",
    tech: [
      "TypeScript",
      "WebGPU",
      "WGSL",
      "Metal",
      "Swift",
      "Electron",
      "ONNX Runtime",
    ],
    timeline: "2026 - Present",
  },
  {
    highlights: [
      "C++20/Python toolchain researching native DisplayPort multi-stream (MST) on Apple M5: an IOKit/IORegistry probe CLI with JSON reports and strict exit codes, plus AUX/MST protocol decoders (Manchester, I2C-over-AUX, CRC and reassembly).",
      "Traced the display driver's kernel-to-firmware path by static analysis and modeled receiver front ends from component datasheets.",
      "Every private AUX/DPCD path sits behind fail-closed safety gates so a bad call can't hang the display coprocessor. 458 deterministic tests in 9 CTest groups run with sanitizer builds, and capture tooling records SHA-256-hashed evidence so results are reproducible.",
    ],
    name: "MacMST",
    repo: "https://github.com/yassinsolim/MacMST",
    summary:
      "Safety-first research toolchain for native DisplayPort MST on Apple Silicon M5.",
    tech: ["C++20", "Python", "IOKit", "CMake / CTest", "DisplayPort"],
    timeline: "2026",
  },
  {
    highlights: [
      "Finds songs by how they sound across a 272,853-track catalog, blending learned audio embeddings with a DSP engine measured straight from the waveform. Ships as a web app, an always-on API, a mobile companion, and a Spicetify extension that adds a right-click \u201CFind soundalikes\u201D menu inside Spotify.",
      "Trained self-supervised audio embeddings on 106K tracks on a local RTX 5080, lifting frozen genre-probe accuracy from 0.25 to 0.641. Raised training GPU utilization from 9% to 99% and measured a 4.2x FP16/channels-last speedup with a custom cuDNN solver inspector.",
      "Extension updates only run after signature, pinned-commit, SHA-256, and integrity checks, falling back to the last verified build, and a cron-scheduled API probe has to pass before any deploy goes out.",
    ],
    name: "soundalike",
    repo: "https://github.com/yassinsolim/soundalike",
    site: "https://soundalike.yassin.app",
    summary:
      "Open-source music recommender that matches songs by timbre and vibe rather than tags.",
    tech: [
      "Python",
      "PyTorch",
      "CUDA",
      "cuDNN",
      "NumPy",
      "Self-Supervised Learning",
      "DSP",
    ],
    timeline: "2026",
  },
  {
    highlights: [
      "Account-free, privacy-first navigation for Calgary built on OpenStreetMap-derived data, MapLibre, and self-hosted Valhalla and Nominatim, with no tracking accounts and on-device storage for saved places.",
      "Expo/React Native iOS client backed by a native Swift navigation core handling map matching, rerouting, spoken guidance, arrival hysteresis, and CarPlay. Fixed on-device issues like starved location updates, a stalling position puck, and a route line re-tessellated every animation frame.",
      "Strict TypeScript pnpm/Turbo monorepo with shared Zod contracts and generated OpenAPI 3.1, a Fastify API, a 17-variant Calgary route regression matrix, simulator journeys in CI, and TestFlight builds from hosted macOS runners.",
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
      "CarPlay",
      "Fastify",
      "MapLibre",
      "Valhalla",
    ],
    timeline: "2026",
  },
  {
    highlights: [
      "Chrome extension that turns the insurer's collision-claim PDF a repair shop already received into a review-ready Mitchell Connect draft: contact, vehicle, insurance, and estimate line items.",
      "Extracts PDF text in the browser with PDF.js and sends only compact text through an access-controlled AI service with strict structured output. The model key stays server-side and never ships in the extension.",
      "Fill-only by design: every field is reviewed and Save stays manual. Handles Mitchell's asynchronous selectors like VIN decode, paint codes, and insurance carriers, and is currently in private beta.",
    ],
    name: "Bowstack",
    site: "https://bowstack.ca",
    summary:
      "Chrome extension that turns insurer claim PDFs into Mitchell Connect drafts for collision shops.",
    tech: [
      "TypeScript",
      "Chrome Extension (MV3)",
      "WXT",
      "PDF.js",
      "OpenAI API",
      "Vitest",
      "Playwright",
    ],
    timeline: "2026",
  },
  {
    highlights: [
      "Browser arcade-sim racing engine with custom vehicle physics tuned for the Nordschleife.",
      "12.7K lines covering raycast suspension, drift handling, and ghost replays.",
      "Real-time multiplayer over Supabase with ghost replays for solo time attack and a Postgres global leaderboard secured by row-level security.",
      "Built in TypeScript and Three.js and embedded into the 3D personal site.",
    ],
    name: "Nordschleife Racer",
    repo: "https://github.com/yassinsolim/nordschleife-racer",
    site: "https://yassin.app",
    summary:
      "Arcade-sim racing engine with custom physics, multiplayer, and ghost replays.",
    tech: [
      "TypeScript",
      "Three.js",
      "WebGL",
      "Supabase",
      "WebSockets",
      "Vehicle Physics",
    ],
    timeline: "2026",
  },
  {
    highlights: [
      "Source-style kinematic movement controller running a unit-tested, fixed 128 Hz simulation with surf, ground, and air handling, ramp clipping, and slide movement.",
      "Map manifest system with BVH collision against static triangle meshes, plus a separate render scene and camera for the first-person viewmodel pipeline.",
      "Real-time multiplayer over Supabase Realtime, with a host player's client running bots and hit detection, plus a run timer and online leaderboard.",
    ],
    name: "WebStrafe",
    repo: "https://github.com/yassinsolim/WebStrafe",
    site: "https://strafe.yassin.app",
    summary:
      "Browser Three.js surf sandbox chasing CS:GO bhop and surf movement feel.",
    tech: [
      "TypeScript",
      "Three.js",
      "Vite",
      "Supabase Realtime",
      "BVH Collision",
    ],
    timeline: "2026",
  },
  {
    highlights: [
      "Personal desktop OS in the browser, built on daedalOS with Next.js, React, and TypeScript, and embedded as the working monitor screen inside the 3D site at yassin.app.",
      "Custom Portfolio app, project workspaces on the desktop, and a PDF viewer that renders the resume's real, selectable text with clickable links.",
      "Originally containerized with Docker and self-hosted on a Proxmox VE homelab, now deployed on Vercel.",
    ],
    name: "yassinOS",
    repo: "https://github.com/yassinsolim/yassinOS",
    site: "https://os.yassin.app",
    summary:
      "Browser desktop OS, built on daedalOS, that runs inside the 3D site's monitor.",
    tech: [
      "Next.js",
      "React",
      "TypeScript",
      "styled-components",
      "Docker",
      "Vercel",
    ],
    timeline: "Dec 2025 - Present",
  },
  {
    highlights: [
      "Co-lead software for a 10-engineer team building a robotic surgical arm, centered on a ROS 2 (Jazzy) C++/Python ground station with a URDF/Xacro robot description, RViz visualization, telemetry, diagnostics, and safety monitoring.",
      "Built an interactive inverse-kinematics demo: a ROS 2 node that calls MoveIt's IK service to drive joint trajectories to Cartesian targets, OMPL planning and joint-limit config, and a C++ RViz control panel. Unreachable targets abort cleanly instead of commanding a partial move.",
      "Wrote the arm's real-time motion control in embedded C/C++ on Arduino (1 kHz PID with anti-windup, encoder interrupts, filtered sensor input) and co-developed wireless teleoperation over Arduino UNO R4 WiFi boards with rate-limited servo commands.",
    ],
    name: "Waybionic",
    repo: "https://github.com/Waybionic/waybionic_ground_station",
    site: "https://waybionic.com",
    summary:
      "ROS 2 ground station and embedded control for the UCalgary Waybionic robotic surgical arm.",
    tech: ["ROS 2", "C++", "Python", "MoveIt", "RViz", "Docker", "Arduino"],
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
      "Shipped a backward-data convolution solver and 7x7 depthwise dispatch upstream to MIOpen for MI355X, reusing the forward kernel with a rotated filter (no new kernel or workspace): ConvNeXt-Large fp16 training +50%, forward +67%.",
      "Found and gated a silent-correctness defect in three assembly convolution solvers that indexed memory with 32-bit offsets past INT_MAX. Wrong forward results on 14 customer shapes went from 6/14 to 0/14, and the set got 1.12x faster.",
      "Tuned and shipped pre-tuned kernel-selection databases for 5 GPU architectures (95K find / 82K perf entries), with benchmark-confirmed solver overrides up to 3x faster.",
      "Cut a 225,990-command GPU validation suite 98.2% to 4,096 at full feature coverage (about 50 GPU-days down to 1), and rebuilt an internal dashboard's query path from 483 s to 11 s over 264M rows.",
      "Prototyped hipDNN heuristic plugins for SDPA/attention and convolution regime classification, and built SLURM benchmark orchestration and a Python database viewer across about 10K lines of Python and shell.",
    ],
    location: "Calgary, AB",
    role: "Software Engineer Intern, AI GPU Software (AGS) Libraries",
    tech: [
      "C++",
      "Python",
      "ROCm",
      "MIOpen",
      "hipDNN",
      "SLURM",
      "Kubernetes",
      "CMake",
    ],
    timeline: "May 2026 - Present",
  },
  {
    company: "Waybionic (Student Design Team)",
    highlights: [
      "Co-lead software for a robotic surgical arm and direct 10 engineers: a ROS 2 C++/Python ground station (telemetry, diagnostics, safety monitoring), the contributing guide, and 19 code reviews across 9 PRs.",
      "Built a Docker-first dev environment (pinned ROS 2 Jazzy base, non-root Dev Container, multi-stage build/test) that runs in x86-64 and ARM64 GitHub Actions CI with 41 tests and 0 failures.",
      "Added native Apple Silicon development via RoboStack, and wrote the arm's embedded C/C++ motion control on Arduino (1 kHz PID with anti-windup, encoder interrupts, filtered sensor input).",
    ],
    location: "Calgary, AB",
    role: "Software Co-Lead",
    tech: ["ROS 2", "C++", "Python", "Docker", "GitHub Actions", "Arduino"],
    timeline: "Nov 2024 - Present",
  },
  {
    company: "Press Start (UCalgary)",
    highlights: [
      "Lead embedded software for a new student initiative building custom gaming handhelds.",
      "Planning the OS and driver layer, Bluetooth multiplayer, and touchscreen input, starting with game prototypes like Pong, Brick Breaker, and Snake.",
    ],
    location: "Calgary, AB",
    role: "Embedded Software Lead",
    tech: ["Embedded C/C++", "Bluetooth", "Touchscreen Input"],
    timeline: "Ongoing",
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

export const openSource = [
  {
    highlights: [
      "Merged 6 upstream PRs across Spicetify's Marketplace, the extension store inside the Spotify desktop client, and its CLI.",
      "#1212 fixed install-state race conditions where installs were lost if the client reloaded before IndexedDB writes finished: every storage mutation now runs behind a queue with atomic writes and rollback, verified with harness tests and live Spotify runs.",
      "#1209 centralized Zod validation of untrusted manifests with corrupted-cache recovery. Also fixed translations (#1210), album-art colors (#1211), the empty installed tab (#1218), and the CLI's PATH setup docs (#3903).",
    ],
    links: [
      {
        label: "Merged PRs",
        url: "https://github.com/search?q=org%3Aspicetify+author%3Ayassinsolim+is%3Apr+is%3Amerged&type=pullrequests",
      },
      {
        label: "PR #1212",
        url: "https://github.com/spicetify/marketplace/pull/1212",
      },
      {
        label: "PR #1209",
        url: "https://github.com/spicetify/marketplace/pull/1209",
      },
    ],
    name: "Spicetify Marketplace & CLI",
    role: "Contributor",
    tech: ["TypeScript", "React", "IndexedDB", "Zod", "i18next"],
    timeline: "2026",
  },
  {
    highlights: [
      "Upstream contributions to AMD's open-source ROCm libraries during my internship, focused on MIOpen convolution solvers and their shipped kernel-selection databases.",
      "#9568 fixed a silent-correctness bug where three assembly convolution solvers returned wrong results on tensors past INT_MAX: bounded each solver's applicability check, pinned the boundary with unit tests, and pruned 606 shipped database entries that pointed at the broken path.",
    ],
    links: [
      {
        label: "Merged PRs",
        url: "https://github.com/ROCm/rocm-libraries/pulls?q=is%3Apr+author%3Ayassinsolim+is%3Amerged",
      },
      {
        label: "PR #9568",
        url: "https://github.com/ROCm/rocm-libraries/pull/9568",
      },
    ],
    name: "ROCm Libraries (MIOpen)",
    role: "Contributor, AMD intern",
    tech: ["C++", "ROCm", "MIOpen", "CMake"],
    timeline: "2026",
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
  timeline: "Sept 2023 - April 2028 (expected)",
};

export const skills = {
  aiGpu: [
    "ROCm",
    "MIOpen",
    "hipDNN",
    "CUDA",
    "cuDNN",
    "WebGPU / WGSL",
    "Metal",
    "ONNX Runtime",
    "GPU Kernels",
    "GPU Profiling",
    "PyTorch",
    "NumPy",
    "OpenCV",
    "Ultralytics YOLOv8",
    "supervision (ByteTrack)",
  ],
  frameworks: [
    "React",
    "Next.js",
    "Three.js",
    "WebGL",
    "ROS 2",
    "MoveIt",
    "RViz",
    "Electron",
    "JUnit",
    "Swing",
    "Django",
    "Node.js",
    "Fastify",
    "Expo / React Native",
    "Vue",
    "Zod",
    "Supabase",
    "AWS (API Gateway, Lambda, DynamoDB, SNS, S3)",
    "CI/CD",
  ],
  languages: [
    "C++",
    "C",
    "Python",
    "TypeScript",
    "JavaScript",
    "Swift",
    "Java",
    "Go",
    "SQL (MySQL, PostgreSQL)",
    "Bash",
    "HTML5",
    "CSS",
    "TailwindCSS",
    "Arduino",
  ],
  tools: [
    "Git/GitHub",
    "GitHub Actions",
    "SLURM",
    "CMake / CTest",
    "Docker",
    "Kubernetes",
    "Ansible",
    "Jenkins",
    "GitLab CI",
    "Agile",
    "Atlassian/Jira",
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
