"use client";

import { useEffect, useState } from "react";
import { LazyMotion, MotionConfig } from "motion/react";
import * as m from "motion/react-m";
import Footer1 from "@/components/ui/footer-section-1";
import PortfolioFolders from "@/components/portfolio-folders";
import SculptureHero from "@/components/ui/liquid-sculpture-hero";
import Timeline from "@/components/ui/timeline";
import OrbitImages from "@/components/ui/orbit-images";
import LoadingScreen from "@/components/ui/loading-screen";
import LenisProvider from "@/components/ui/lenis-provider";
import SignatureHero from "@/components/ui/signature-hero";
import FlexCarousel, { type FlexCarouselItem } from "@/components/ui/flex-carousel";
import TextBlockAnimation from "@/components/ui/text-block-animation";
import MaskedHeading from "@/components/ui/masked-heading";
import AboutMeSection from "@/components/about-me-section";

const carouselItems: FlexCarouselItem[] = [
  {
    src: "/flex-carousel/carousel-1.webp",
    alt: "Me with My Lab Friends",
    title: "Quick Picture after Lab Meeting",
    subtitle: "SEA Laboratory ",
  },
  {
    src: "/flex-carousel/carousel-2.webp",
    alt: "Exit I-Smile Lab",
    title: "Memories of I-Smile Lab",
    subtitle: "I-Smile Laboratory",
  },
  {
    src: "/flex-carousel/carousel-3.webp",
    alt: "Study Group Event Introduction to AI",
    title: "Study Group Event: Introduction to AI",
    subtitle: "First time as Event Coordinator",
  },
  {
    src: "/flex-carousel/carousel-4.webp",
    alt: "Study Group : Fundamentals of Python",
    title: "Study Group : Fundamentals of Python",
    subtitle: "First time as Logistics Coordinator",
  },
  {
    src: "/flex-carousel/carousel-5.webp",
    alt: "Began my Journey at Telkom University",
    title: "First Day at Telkom University",
    subtitle: "Memories - 1",
  },
  {
    src: "/flex-carousel/carousel-6.webp",
    alt: "Last Photoshoot with Classmates",
    title: "Last Photoshoot with Classmates",
    subtitle: "Memories - 2",
  },
  {
    src: "/flex-carousel/carousel-7.webp",
    alt: "Exit SEA Laboratory",
    title: "Leaving SEA Laboratory",
    subtitle: "SEA Laboratory",
  },
  {
    src: "/flex-carousel/carousel-8.webp",
    alt: "Machine Learning Intern at BRIN",
    title: "Machine Learning Intern",
    subtitle: "First Time Internship",
  },
];

const carouselSectionVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

const carouselStageVariants = {
  hidden: { opacity: 1, y: 0 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

const sectionReveal = {
  hidden: { opacity: 0.85 },
  visible: { opacity: 1 },
};

const sectionRevealTransition = {
  duration: 0.5,
  ease: [0.22, 1, 0.36, 1] as const,
};

const loadDomMax = () =>
  import("@/lib/motion-features").then((mod) => mod.domMax);

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <>
      <LazyMotion features={loadDomMax} strict>
        <MotionConfig reducedMotion="user">
        <LenisProvider>
        <LoadingScreen />

        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>

        <main className="portfolio-shell" id="main-content" data-theme={theme}>
          <SculptureHero
            brand="Sahrul"
            navLinks={[
              { label: "About", href: "#about" },
              { label: "Work", href: "#work" },
              { label: "Experience", href: "#experience" },
              { label: "Tech Stack", href: "#tech-stack"},
              
            ]}
            navCta={{ label: "Contact", href: "mailto:sahrulfirdauz9987@gmail.com" }}
            eyebrow=""
            headline="Ideas, made tangible."
            headlineAccent=""
            body="A working portfolio for thoughtful digital experiments, useful systems, and the details that make a screen feel human."
            primaryCta={{ label: "Explore the archive", href: "#work" }}
            hint=""
            hintTouch=""
            background="#E8E7E3"
            darkBackground="#111110"
            theme={theme}
            onThemeChange={setTheme}
            loadFonts={false}
            sculptureScale={0.92}
            mobileSculptureScale={0.9}
            particleDensity={0.8}
            showCredit={false}
            imageAlt="Abstract sculpture of interwoven metallic filaments and particles"
            height="100svh"
            fixedNav
            backdropLayer={<SignatureHero />}
          />

          <MaskedHeading
            text="When you're going to change the world. don't ask for permission."
            mediaType="image"
            src="/poster-2.webp"
            poster="/poster-2.webp"
            fillScale={1.25}
            parallax={26}
            reveal="scale"
            trigger="view"
            spotlight={false}
            spotlightRadius={180}
            outline={false}
            duration={1.1}
            stagger={0.09}
            drift={18}
            hoverZoom={0}
            align="center"
            brightness={1}
            saturation={1}
            grayscale={false}
            outlineWidth={1}
            weight={700}
            tracking={-0.03}
            lineHeight={1.06}
            textScale={0.1}
          />

          <AboutMeSection theme={theme} />

          <m.section
            className="carousel-section"
            id="studies"
            aria-label="Trackside studies"
            initial="hidden"
            animate="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.15 }}
            variants={carouselSectionVariants}
          >
            <m.div
              className="carousel-stage-motion"
              variants={carouselStageVariants}
            >
              <div className="carousel-stage">
                <FlexCarousel
                  items={carouselItems}
                  preset="liquid"
                  intro="rise"
                  cardHeight={0.33}
                  gap={12}
                  squeeze={0.2}
                  focusOnClick
                  captions
                  fit="natural"
                  radius={0}
                  lensWidth={0.74}
                  lensHeight={1.18}
                  tilt={62}
                  roundness={1}
                  bend={0.28}
                  reach={0.38}
                  curl="twist"
                  dispersion={0.45}
                  liquid={0}
                  followCursor={false}
                  autoplay={false}
                  interval={4}
                  captureWheel={false}
                />
              </div>
            </m.div>
          </m.section>

          <m.section
            className="folder-section"
            id="work"
            initial="hidden"
            animate="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.18 }}
            variants={sectionReveal}
            transition={sectionRevealTransition}
          >
            <span id="folders" aria-hidden="true" />
            <div className="folder-section-grid">
              <div className="section-intro">
                <div className="section-heading">
                  <TextBlockAnimation>
                    <h2>A record of progress</h2>
                  </TextBlockAnimation>
                </div>
                <TextBlockAnimation
                  delay={0.12}
                  duration={0.5}
                  blockColor="var(--portfolio-muted)"
                >
                  <p>
                    A collection of my academic background, practical projects, and ongoing exploration of data-driven systems.
                  </p>
                </TextBlockAnimation>
              </div>
              <PortfolioFolders />
            </div>
          </m.section>

          <section className="experience-section" id="experience">
            <Timeline
              title="Work in motion"
              periodLabel="2022 — 2026"
              textColor="var(--portfolio-ink)"
              mutedTextColor="var(--portfolio-muted)"
              activeColor="var(--portfolio-accent)"
              backgroundColor="transparent"
              duration={1.4}
            />
          </section>

          <m.section
            className="orbit-section"
            id="tech-stack"
            initial="hidden"
            animate="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={sectionReveal}
            transition={sectionRevealTransition}
          >
            <div className="orbit-section-copy">
              <TextBlockAnimation>
                <h2>Tech Stack</h2>
              </TextBlockAnimation>
              <TextBlockAnimation
                delay={0.12}
                duration={0.5}
                blockColor="var(--portfolio-muted)"
              >
                <p>
                  The technologies and tools I use to build and maintain my projects.
                </p>
              </TextBlockAnimation>
            </div>
            <OrbitImages
              images={[
                { src: "/tech-stack/c.svg", alt: "Chrome studio study under iridescent light" },
                { src: "/tech-stack/python.svg", alt: "Climbing the Esses at Circuit of the Americas" },
                { src: "/tech-stack/typescript.svg", alt: "Rain-soaked race suit in the paddock" },
                { src: "/tech-stack/react.svg", alt: "Close-up of helmet and iridescent visor in studio" },
                { src: "/tech-stack/node.svg", alt: "Rain-soaked race suit in the paddock" },         
                { src: "/tech-stack/next.svg", alt: "High-angle climb up Beau Rivage in Monte Carlo" },
                { src: "/tech-stack/torch.svg", alt: "Rain-soaked race suit in the paddock" },
                { src: "/tech-stack/firebase.svg", alt: "Rain-soaked race suit in the paddock" },
                { src: "/tech-stack/sql.svg", alt: "Rain-soaked race suit in the paddock" },
              ]}
              radiusX={330}
              radiusY={105}
              rotation={-8}
              duration={34}
              itemSize={92}
              depth={0.6}
              showPath
              // centerContent={
              //   <TextBlockAnimation delay={0.18} duration={0.5}>
              //     <h3 className="text-[clamp(1.75rem,3.2vw,3rem)] font-bold tracking-[-0.04em] leading-none">
              //       Moments
              //     </h3>
              //   </TextBlockAnimation>
              // }
            />
          </m.section>
          <Footer1 />
        </main>
        </LenisProvider>
        </MotionConfig>
      </LazyMotion>
    </>
  );
}