"use client";

import type { Variants } from "motion/react";
import * as m from "motion/react-m";
import { ArrowUpRight } from "lucide-react";
import { SocialCloud } from "@/components/ui/footer-section-1-utils/social-cloud";

const footerLinks = [
  { label: "About", href: "#about" },
  { label: "Work", href: "#work" },
  { label: "Experience", href: "#experience" },
  { label: "Tech Stack", href: "#tech-stack" },
];

const footerLinkEntries = (() => {
  const counts = new Map<string, number>();
  return footerLinks.map((link) => {
    const base = `${link.href}::${link.label}`;
    const seen = counts.get(base) ?? 0;
    counts.set(base, seen + 1);
    return {
      ...link,
      key: seen === 0 ? base : `${base}::${seen}`,
    };
  });
})();

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 22 },
  },
};

const textVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function Footer1() {
  return (
    <footer className="site-footer" id="contact" aria-labelledby="footer-heading">
      <m.div
        className="site-footer-content"
        initial="hidden"
        animate="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.25, margin: "0px 0px -80px 0px" }}
        variants={containerVariants}
      >
        <m.div
          variants={itemVariants}
          className="site-footer-intro"
        >
          <m.h2 variants={textVariants} id="footer-heading">
            Let&apos;s make it considered.
          </m.h2>
          <m.p variants={textVariants}>
            Open to thoughtful collaborations, useful systems, and work that earns its place.
          </m.p>
        </m.div>

        <m.div
          variants={itemVariants}
        >
          <m.a
            className="site-footer-contact"
            href="mailto:sahrulfirdauz9987@gmail.com?subject=Portfolio%20conversation"
            whileHover={{ x: 8 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>Start a conversation</span>
            <ArrowUpRight aria-hidden="true" size={22} strokeWidth={1.8} />
          </m.a>
        </m.div>

        <m.nav
          variants={itemVariants}
          className="site-footer-links"
          aria-label="Footer navigation"
        >
          {footerLinkEntries.map((link) => (
            <m.a
              key={link.key}
              href={link.href}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              {link.label}
            </m.a>
          ))}
          <m.a href="#main-content" whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
            Back to top
          </m.a>
        </m.nav>

        <m.div variants={itemVariants}>
          <SocialCloud />
        </m.div>
      </m.div>

      <m.p
        className="site-footer-copyright"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 0.72, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.8 }}
        transition={{ duration: 0.45, delay: 0.15, ease: "easeOut" }}
      >
        © {new Date().getFullYear()} Sahrul. Built with care.
      </m.p>
    </footer>
  );
}
