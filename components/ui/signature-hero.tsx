"use client";

import { useRef, type RefObject } from "react";
import ScrollVelocity from "./scroll-velocity";
import { useSignatureHeroScroll } from "./signature-hero-motion";

export interface SignatureHeroProps {
  /** Ref to the sticky/pinned hero root element (.sh-root) */
  heroRootRef?: RefObject<HTMLElement | null>;
  /** Ref to the foreground liquid sculpture viewport (.sh-viewport) that shrinks */
  foregroundViewportRef?: RefObject<HTMLDivElement | null>;
  /** Ref to the foreground hero copy (.sh-content) so it can fade as the viewport shrinks */
  foregroundCopyRef?: RefObject<HTMLDivElement | null>;
}

const VELOCITY_TEXTS = ["Computer Engineering", "Personal Portfolio"];

function SignatureBackdropSvg({
  signatureRef,
}: {
  signatureRef: RefObject<SVGSVGElement | null>;
}) {
  return (
    <div className="signature-container">
      <svg
        ref={signatureRef}
        className="signature-svg"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 700 320"
        aria-label="Sahrul signature"
        role="img"
      >
        <defs>
          <filter
            id="ink-bleed"
            x="-10%"
            y="-10%"
            width="120%"
            height="120%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.035"
              numOctaves={2}
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={1.4}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          <linearGradient
            id="signatureInk"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#0a1128" />
            <stop offset="60%" stopColor="#1c2541" />
            <stop offset="100%" stopColor="#0b132b" />
          </linearGradient>
        </defs>

        <g transform="translate(20, 20)">
          <path
            className="stroke-body"
            d="
              M 235 185
              C 220 180, 215 155, 238 142
              C 255 132, 275 145, 268 175
              C 265 188, 275 188, 285 170
              C 292 158, 298 145, 302 135
              C 310 110, 318 75, 322 60
              C 328 45, 332 50, 328 72
              C 320 110, 310 160, 312 188
              C 314 195, 328 160, 342 152
              C 352 148, 360 162, 356 180
              C 353 190, 365 162, 378 155
              C 390 148, 396 158, 393 170
              C 388 185, 402 185, 412 168
              C 420 152, 430 150, 436 162
              C 442 178, 448 185, 460 175
              C 472 162, 480 142, 488 120
              C 500 85, 518 38, 525 30
              C 530 22, 534 32, 522 68
              C 508 112, 495 165, 510 188
              C 525 210, 575 185, 615 162
            "
          />

          <path
            className="stroke-s"
            d="
              M 280 65
              C 230 20, 110 20, 80 85
              C 55 140, 120 165, 200 150
              C 290 132, 330 175, 260 235
              C 195 290, 80 270, 45 220
              C 25 190, 35 155, 65 130
              C 100 100, 190 120, 240 165
            "
          />

          <path
            className="stroke-flourish"
            d="
              M 590 170
              C 530 210, 360 250, 190 262
              C 120 267, 85 260, 115 250
              C 150 240, 240 235, 330 232
            "
          />

          <circle className="ink-dot" cx="628" cy="152" r="4" />
          <circle className="ink-dot" cx="642" cy="142" r="2.8" />
        </g>
      </svg>
    </div>
  );
}

export default function SignatureHero({
  heroRootRef,
  foregroundViewportRef,
  foregroundCopyRef,
}: SignatureHeroProps) {
  const backdropContainerRef = useRef<HTMLDivElement>(null);
  const signatureRef = useRef<SVGSVGElement>(null);

  useSignatureHeroScroll({
    backdropContainerRef,
    signatureRef,
    heroRootRef,
    foregroundViewportRef,
    foregroundCopyRef,
  });

  return (
    <div ref={backdropContainerRef} className="signature-backdrop-stage">
      <div className="signature-backdrop-meta" aria-hidden="true">
        <ScrollVelocity
          texts={VELOCITY_TEXTS}
          velocity={100}
          skewWithVelocity={0}
          scaleWithVelocity={0}
          draggable
          fontSize={80}
          fontWeight={700}
          className="custom-scroll-text"
          numCopies={6}
          damping={50}
          stiffness={400}
          separator=""
          fadeEdges
          outlineAlternate={false}
          gap={0}
          pauseOnHover={false}
        />
      </div>

      <SignatureBackdropSvg signatureRef={signatureRef} />
    </div>
  );
}
