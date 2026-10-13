import type { SiteContent } from "./schema";

// Placeholder content. Everything here is editable from /admin once signed in.
export const defaultContent: SiteContent = {
  meta: {
    siteTitle: "Nishant Meena · IIT Kharagpur",
    description:
      "Portfolio of Nishant Meena, Dual Degree (B.Tech + M.Tech) student at IIT Kharagpur.",
  },
  profile: {
    name: "Nishant Meena",
    firstName: "Nishant",
    headline: "Dual Degree (B.Tech + M.Tech) · IIT Kharagpur",
    roles: ["Developer", "Designer", "Problem Solver"],
    tagline:
      "I build things that live at the intersection of engineering and design. Welcome to my corner of the internet, all the way from Earth to my study table.",
    photo: "",
    location: "Atal Bihari Vajpayee Hall, IIT Kharagpur, West Bengal, India",
    email: "",
    phone: "",
    resumeUrl: "",
    availability: "Open to internships and research collaborations",
  },
  socials: [
    { label: "GitHub", url: "https://github.com/Nishant480" },
    { label: "LinkedIn", url: "" },
    { label: "Email", url: "" },
  ],
  about: {
    paragraphs: [
      "I'm a Dual Degree student at the Indian Institute of Technology Kharagpur, pursuing an integrated B.Tech and M.Tech. Add your department and what drives you here.",
      "Outside the classroom I enjoy building products, exploring new tech and taking part in campus life. Replace this text from the admin panel.",
    ],
    stats: [
      { value: "5", label: "Year Dual Degree" },
      { value: "0+", label: "Projects shipped" },
      { value: "0", label: "Internships" },
      { value: "∞", label: "Cups of chai" },
    ],
  },
  education: [
    {
      institute: "Indian Institute of Technology Kharagpur",
      degree: "Dual Degree (B.Tech + M.Tech)",
      field: "Your Department",
      start: "20XX",
      end: "20XX",
      score: "CGPA: X.XX / 10",
      details: ["Atal Bihari Vajpayee Hall of Residence"],
      logo: "",
    },
    {
      institute: "Your Senior Secondary School",
      degree: "Class XII",
      field: "",
      start: "",
      end: "20XX",
      score: "XX%",
      details: [],
      logo: "",
    },
  ],
  experience: [
    {
      company: "Company / Lab name",
      role: "Intern",
      location: "Remote",
      start: "May 20XX",
      end: "Jul 20XX",
      points: ["What you built and the impact it had, with numbers if possible."],
      tech: ["Python", "React"],
      link: "",
    },
  ],
  projects: [
    {
      title: "Earth-to-Laptop Portfolio",
      summary: "This website. A scroll-driven 3D journey from a spinning Earth to my study table.",
      points: [
        "React Three Fiber scenes stitched into one scroll timeline",
        "Google-only admin panel controlling every piece of content",
      ],
      tech: ["Next.js", "Three.js", "GSAP"],
      image: "",
      repo: "",
      live: "",
      period: "2026",
      featured: true,
    },
    {
      title: "Project Two",
      summary: "One line on what it does and why it matters.",
      points: ["Key highlight"],
      tech: ["Tech"],
      image: "",
      repo: "",
      live: "",
      period: "",
      featured: false,
    },
  ],
  research: [
    {
      title: "M.Tech Thesis / Research Project",
      guide: "Prof. Name, Department",
      period: "20XX – Present",
      summary: "Describe your research problem and approach.",
      points: [],
      link: "",
    },
  ],
  skills: [
    { group: "Languages", items: ["C++", "Python", "JavaScript", "TypeScript"] },
    { group: "Web & 3D", items: ["React", "Next.js", "Three.js", "GSAP"] },
    { group: "Tools", items: ["Git", "Linux", "Figma"] },
  ],
  achievements: [{ title: "Achievement title", detail: "Short detail", year: "20XX" }],
  positions: [
    {
      role: "Position title",
      organisation: "Society / Hall / Club, IIT Kharagpur",
      period: "20XX – 20XX",
      points: ["What you led or organised"],
    },
  ],
  coursework: ["Data Structures & Algorithms", "Machine Learning", "Probability & Statistics"],
  certifications: [],
  extracurricular: ["Hall sports and cultural events"],
  contact: {
    heading: "Let's build something together",
    message: "My inbox is always open. Whether it's an internship, a project or just a hello, I'll get back to you.",
  },
  sections: [
    { id: "about", title: "About", visible: true },
    { id: "education", title: "Education", visible: true },
    { id: "experience", title: "Experience", visible: true },
    { id: "projects", title: "Projects", visible: true },
    { id: "research", title: "Research", visible: true },
    { id: "skills", title: "Skills", visible: true },
    { id: "achievements", title: "Achievements", visible: true },
    { id: "positions", title: "Positions of Responsibility", visible: true },
    { id: "coursework", title: "Coursework & Certifications", visible: true },
    { id: "extracurricular", title: "Beyond Academics", visible: true },
    { id: "contact", title: "Contact", visible: true },
  ],
  journey: {
    campusName: "IIT Kharagpur",
    hallName: "Atal Bihari Vajpayee Hall",
    roomLabel: "My Room",
  },
};
