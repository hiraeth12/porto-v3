"use client";

import { AtSign, Code2, Globe } from "lucide-react";

type SocialCloudProps = {
  className?: string;
};

const socialLinks = [
  { label: "GitHub", href: "https://github.com/hiraeth12", icon: Code2 },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/sahrulfirdaus", icon: Globe },
  { label: "Email", href: "mailto:sahrulfirdauz9987@gmail.com", icon: AtSign },
];

export function SocialCloud({ className = "" }: SocialCloudProps) {
  return (
    <nav className={`social-cloud ${className}`} aria-label="Social links">
      {socialLinks.map(({ label, href, icon: Icon }) => (
        <a
          key={label}
          href={href}
          aria-label={label}
          className="social-cloud-link"
          target={href.startsWith("http") ? "_blank" : undefined}
          rel={href.startsWith("http") ? "noreferrer" : undefined}
        >
          <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
          <span>{label}</span>
        </a>
      ))}
    </nav>
  );
}
