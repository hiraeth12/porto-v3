"use client";

import { useEffect, useId, useState } from "react";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";

const BRAND_VIEWBOX = "0 0 825.6 708";

const LEFT_WING_PATH =
  "M282.598 71.99 L283.789 72 C284.602 76.475 291.735 84.764 294.401 89.071 C296.268 92.088 297.346 95.353 299.179 98.341 C299.883 99.488 301.125 100.186 301.781 101.384 C303.317 104.186 304.506 107.184 306.096 109.955 C307.149 111.79 308.625 113.395 309.623 115.261 C310.834 117.524 311.665 120.095 312.949 122.289 C313.451 123.147 314.337 123.7 314.852 124.557 C320.715 134.318 326.492 144.171 332.268 153.983 C333.104 155.403 333.349 157.26 334.175 158.576 C338.967 166.217 343.619 173.923 348.052 181.876 C352.588 190.016 357.162 198.015 361.939 206.027 C363.529 208.695 366.056 210.659 367.327 213.603 C367.669 214.394 367.499 215.468 367.5 216.3 C364.59 216.268 362.263 214.654 359.539 213.746 C355.314 212.338 350.991 211.38 346.778 209.888 C343.226 208.63 339.827 206.804 336.342 205.535 C332.427 204.109 327.966 203.585 323.939 202.278 C321.487 201.482 319.175 200.133 316.794 199.366 C306.142 195.935 295.684 192.518 285.274 188.604 C277.552 185.701 269.717 183.308 262.048 180.271 C260.669 179.725 258.738 179.652 257.6 178.672 C255.68 177.019 254.915 174.229 253.419 172.205 C244.643 160.332 238.369 146.985 229.878 134.893 C223.193 132.867 214.866 134.1 207.894 134.1 C193.784 134.1 179.532 133.529 165.448 134.41 C168.77 142.515 174.91 149.23 179.556 156.547 C181.1 158.977 181.867 161.999 183.414 164.396 C186.902 169.798 191.103 174.826 194.721 180.149 C201.648 190.341 208.029 200.842 214.6 211.264 C230.694 216.243 246.953 220.907 262.988 226.164 C273.812 229.712 284.477 233.883 295.349 237.289 C314.008 243.135 332.935 248.295 351.395 254.43 C362.208 258.023 373.337 260.444 384.249 263.792 C387.344 264.741 393.757 264.557 394.783 268.134 L395.932 268.2 C396.608 270.037 398.183 271.338 399.199 273.015 C403.151 279.54 406.81 286.3 410.781 292.745 C411.488 293.891 412.741 294.58 413.381 295.79 C417.84 304.231 422.39 312.48 427.361 320.665 C429.133 323.582 431.36 326.221 433.096 329.231 C434.15 331.059 434.674 333.131 435.695 334.949 C440.096 342.787 445.317 350.234 449.853 357.961 C452.382 362.268 454.462 366.972 456.959 371.313 C458.107 373.308 459.749 374.906 460.979 376.794 C464.712 382.521 467.843 388.669 471.329 394.566 L471.026 395.948 L472.142 396 C473.917 401.007 477.899 405.684 480.492 410.228 C486.45 420.671 491.968 431.449 498.136 441.822 C498.753 442.86 499.812 443.517 500.507 444.488 C502.094 446.705 505.933 453.48 506.422 456.005 C509.458 456.864 512.343 466.039 514.209 468.828 C515.942 471.416 525.751 486.653 525.812 488.653 C525.91 491.875 522.035 495.674 520.421 498.237 C516.552 504.382 513.056 510.722 509.211 516.911 C506.773 520.835 503.506 524.678 502.189 529.203 C499.493 529.964 497.475 536.144 496.017 538.501 C490.495 547.432 484.532 556.191 479.314 565.338 C474.483 573.805 468.937 581.894 463.954 590.147 C462.021 593.349 460.528 596.844 458.587 600.004 C448.497 616.424 438.105 632.423 428.652 649.095 C424.504 656.409 418.18 663.179 414.967 670.981 L411.593 671.1 C409.167 668.636 408.154 665.423 406.452 662.511 C401.853 654.647 396.796 646.756 392.014 639.047 C385.427 628.428 379.077 617.356 372.383 606.846 C369.056 601.621 364.191 595.733 362.358 589.8 L361.19 589.76 C360.724 588.113 359.318 587.22 358.56 585.718 C354.466 577.61 349.422 570.23 344.614 562.552 C342.669 559.445 341.347 555.985 339.404 552.877 C337.089 549.177 333.135 544.988 332.401 540.607 L331.207 540.6 C329.526 534.734 323.27 530.494 322.193 524.4 L320.998 524.393 C319.989 520.545 316.84 517.762 315.533 514.2 L314.384 514.135 L313.794 511.2 L312.599 511.195 L310.764 506.4 L309.594 506.365 C308.982 502.736 305.768 499.879 304.808 496.23 L303.631 496.2 C302.834 492.37 299.256 489.403 298.211 485.445 L297.047 485.4 C296.365 483.29 294.971 481.816 293.953 479.894 C291.573 475.401 289.297 470.769 286.599 466.471 C283.621 461.727 279.579 457.228 277.742 451.8 L276.6 451.742 L276.6 449.259 C274.951 448.025 274.566 447.137 274.171 445.193 C271.657 444.477 269.84 439.781 269.334 437.4 L268.184 437.336 C267.65 435.324 264.672 432.071 265.171 430.257 C262.337 429.215 261.227 425.648 260.34 423 L259.185 422.942 C258.132 418.963 254.697 416.371 253.755 412.2 L252.589 412.157 C251.611 408.703 248.476 406.179 247.779 402.6 L246.597 402.58 C246.004 399.065 243.308 396.554 242.418 393.071 L241.273 393 C238.577 385.525 230.228 379.624 229.209 371.474 L228.075 371.4 L226.749 368.387 C224.912 367.86 224.711 366.496 224.375 364.794 C222.293 364.204 206.136 337.32 205.056 333.586 C213.053 334.385 221.119 337.248 228.76 339.481 C235.932 341.577 243.319 343.526 250.54 345.331 C257.914 347.173 265.442 348.547 272.81 350.506 C276.959 351.609 281.055 353.256 285.223 354.286 C292 355.96 298.876 356.905 305.414 359.521 C309.656 361.218 312.276 369.935 315.011 370.844 C316.725 377.336 322.736 381.651 325.125 387.662 C328.233 389.926 330.656 394.122 331.148 397.984 C337.05 401.841 339.814 410.215 343.359 416.061 C345.721 419.957 348.427 423.643 350.744 427.609 L350.41 428.962 L351.56 429 C353.786 435.77 361.063 441.967 362.424 448.8 L363.604 448.824 C364.022 451.306 366.09 453.423 367.488 455.497 C370.531 460.014 377.502 469.687 378.65 474.6 L379.8 474.65 L379.85 477 L381.012 477.048 C382.734 483.117 389.315 490.936 392.779 496.437 C395.497 500.753 397.71 505.406 400.406 509.739 C402.158 512.556 405.03 515.631 405.591 518.945 L406.744 519 C407.265 520.552 410.721 527.722 412.272 527.648 C414.833 527.525 419.464 519.078 420.768 516.922 C424.015 511.557 427.099 506.103 430.362 500.734 C432.257 497.615 434.963 495.09 435.809 491.355 C436.429 488.622 435.646 484.872 435.358 482.098 C434.92 477.891 429.265 471.218 427.24 467.45 C421.046 455.922 413.808 445.295 406.979 434.096 C404.427 429.911 402.292 425.445 399.822 421.253 C398.216 418.527 395.343 416.013 394.808 412.847 L393.647 412.8 C392.743 410.007 390.53 407.857 389.981 405 L388.795 404.982 C387.435 400.126 382.554 394.109 379.939 389.627 C371.071 374.424 362.356 359.213 353.233 344.124 C350.929 340.313 345.297 332.739 344.471 328.741 C339.089 324.799 332.978 324.254 326.685 322.384 C314.805 318.853 302.783 315.632 290.766 312.385 C274.747 308.057 259.018 302.264 243.044 297.94 C237.118 296.335 231.011 295.397 225.101 293.712 C215.828 291.068 206.696 287.768 197.409 285.16 C187.41 282.352 177.336 280.011 167.777 275.987 C166.376 273.851 165.347 271.468 163.971 269.381 C161.33 265.376 157.711 261.564 156.542 256.8 L155.386 256.744 C154.908 255.069 153.957 253.733 153.545 251.986 C151.753 251.469 151.675 249.993 151.139 248.4 L149.992 248.34 C149.485 244.283 145.55 240.26 143.164 236.971 C141.758 235.033 140.856 232.648 139.568 230.62 C136.756 226.193 130.461 219.284 129.611 214.266 L128.467 214.2 L128.4 211.867 L127.267 211.8 C125.617 207.294 121.628 203.556 119.044 199.597 C116.387 195.527 114.571 190.905 111.964 186.813 C107.693 180.111 91.374 157.959 90.599 151.8 C88.394 151.181 77.347 132.946 75.673 129.756 C72.197 123.131 67.313 117.048 63.241 110.792 C56.569 100.543 50.484 89.993 44.249 79.552 C41.271 74.564 32.704 65.095 32.7 59.7 L223.227 59.7 C230.208 59.7 272.838 58.16 275.758 59.676 C278.063 60.874 282.16 69.374 282.598 71.99 Z";

const RIGHT_WING_PATH =
  "M790.8 59.4 C790.224 63.963 786.886 67.689 785.326 72 L784.2 72.074 L784.126 73.2 L782.982 73.272 C782.06 76.743 779.156 79.371 778.201 82.795 L777.005 82.8 C775.611 87.706 771.489 92.024 768.81 96.256 C765.168 102.01 761.872 108.033 758.17 113.775 C757.139 115.374 755.532 116.67 754.564 118.285 C752.778 121.265 751.628 124.385 749.895 127.37 C748.818 129.226 747.177 130.848 745.957 132.624 C738.702 135.605 729.257 134.1 721.466 134.1 L679.913 134.1 L526.905 134.1 L474.702 134.1 C472.115 134.1 456.965 133.569 455.784 134.408 C453.86 135.776 459.542 144.424 460.834 146.145 C464.757 151.372 467.827 157.199 471.131 162.816 C472.867 165.766 475.051 168.397 476.823 171.308 C478.529 174.111 480.183 178.223 482.598 180.46 C483.411 181.214 484.863 181.446 485.936 181.489 C500.086 182.056 514.374 181.5 528.537 181.5 L614.041 181.5 L679.595 181.5 C691.831 181.5 704.23 182.069 716.436 181.197 C715.644 185.099 713.211 187.631 711.33 190.942 C710.192 192.946 709.618 195.293 708.339 197.223 C706.706 199.687 704.644 201.654 703.774 204.6 L702.594 204.626 C701.681 208.097 698.666 210.857 696.8 213.87 C690.868 223.448 685.245 233.222 679.347 242.754 C677.921 245.059 673.118 254.341 671.281 255.212 C667.517 256.999 635.627 255.9 629.078 255.9 C612.279 255.9 595.474 256.027 578.676 255.898 C576.873 255.885 575.114 255.333 573.318 255.327 C571.572 255.322 569.859 255.871 568.11 255.896 C553.6 256.11 538.888 256.405 524.4 255.6 C525.067 260.865 530.396 268.111 533.208 272.683 C534.724 275.146 535.667 277.947 537.142 280.434 C538.987 283.544 541.306 286.339 543.142 289.434 C544.011 290.899 544.385 292.56 545.22 293.979 C546.425 296.026 550.312 299.23 549.641 301.8 L550.81 301.84 C552.128 306.838 555.476 310.525 557.936 314.901 C563.403 324.628 568.482 334.755 574.416 344.151 C577.747 349.428 581.448 354.614 584.63 360.067 C585.961 362.347 586.796 364.986 588.069 367.302 C589.944 370.716 592.323 373.767 593.007 377.73 C593.92 383.017 585.998 393.557 582.933 397.872 C580.925 400.698 579.436 403.784 577.513 406.667 C573.942 412.021 569.824 417.402 566.772 423.107 C562.466 431.157 557.278 442.022 550.8 448.5 C549 448.5 548.208 448.178 546.573 447.493 L546.017 445.268 L544.87 445.2 C543.688 441.879 537.315 433.045 538.193 430.215 L537.016 430.2 C536.103 427.141 533.747 424.635 532.25 421.869 C529.256 416.332 526.599 410.6 523.464 405.132 C519.147 397.605 514.177 390.483 510.248 382.697 C509.328 380.874 508.138 379.421 507.594 377.4 L506.399 377.394 C505.402 373.408 503.157 370.849 501.126 367.406 C498.872 363.584 496.89 359.621 494.604 355.824 C490.959 349.769 483.855 340.782 482.351 334.188 C478.346 333.038 478.172 326.554 475.835 323.772 C472.151 319.39 470.1 313.92 467.369 308.96 C465.587 305.724 463.298 302.737 461.475 299.518 C458.354 294.006 455.603 288.205 452.622 282.697 C448.129 274.392 443.011 266.377 438.152 258.251 C436.668 255.769 435.722 253.021 434.25 250.553 C432.853 248.211 431.071 246.162 429.714 243.784 C426.5 238.15 423.825 232.021 420.405 226.477 C418.011 222.598 415.277 218.978 412.955 215.054 C412.011 213.458 411.827 211.529 410.936 209.907 C408.557 205.572 405.375 201.569 402.929 197.256 C402.152 195.885 401.849 194.241 401.124 192.843 C399.384 189.487 396.627 185.122 394.509 181.928 C387.936 172.02 382.15 161.632 376.284 151.334 C375.012 149.1 374.355 146.529 373.038 144.335 C369.802 138.948 361.567 127.571 360.603 121.817 L359.417 121.8 L359.4 120.036 C356.077 118.587 351.172 108.282 349.382 104.766 C344.605 95.388 338.915 86.114 333.421 77.104 C329.97 71.445 325.17 66.246 324.602 59.428 C329.972 60.183 335.657 59.7 341.076 59.7 L371.828 59.7 L471.883 59.7 L701.695 59.7 C731.406 59.7 761.089 59.109 790.8 59.4 Z";

const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as const;
const EASE_SHEEN = [0.42, 0, 0.58, 1] as const;

interface LoadingScreenProps {
  minDuration?: number;
  maxDuration?: number;
  ready?: boolean;
  hold?: boolean;
}

function lockPageScroll(): () => void {
  const html = document.documentElement;
  const body = document.body;

  html.dataset.loading = "true";
  body.dataset.loading = "true";
  html.style.overflow = "hidden";
  body.style.overflow = "hidden";
  if (!window.location.hash) {
    window.scrollTo(0, 0);
  }

  const preventScroll = (e: Event) => {
    e.preventDefault();
  };

  const preventScrollKeys = (e: KeyboardEvent) => {
    const keys = [
      "ArrowUp",
      "ArrowDown",
      "PageUp",
      "PageDown",
      "Home",
      "End",
      " ",
    ];
    if (keys.includes(e.key)) {
      e.preventDefault();
    }
  };

  window.addEventListener("wheel", preventScroll, { passive: false });
  window.addEventListener("touchmove", preventScroll, { passive: false });
  window.addEventListener("keydown", preventScrollKeys, { passive: false });

  return () => {
    window.removeEventListener("wheel", preventScroll);
    window.removeEventListener("touchmove", preventScroll);
    window.removeEventListener("keydown", preventScrollKeys);
    delete html.dataset.loading;
    delete body.dataset.loading;
    html.style.overflow = "";
    body.style.overflow = "";
  };
}

function BrandLogoMotion({ reduceMotion }: { reduceMotion: boolean }) {
  const rawId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const clipId = `brand-clip-${rawId}`;
  const sheenId = `brand-sheen-${rawId}`;

  return (
    <m.div
      className="loading-screen-brand"
      initial={{ opacity: 1, scale: 0.96 }}
      animate={{
        opacity: 1,
        scale: 1,
        transition: reduceMotion
          ? { duration: 0.15 }
          : { duration: 0.85, ease: EASE_OUT_EXPO },
      }}
      exit={{
        opacity: 0,
        scale: reduceMotion ? 1 : 0.88,
        transition: reduceMotion
          ? { duration: 0.15 }
          : { duration: 0.42, ease: EASE_OUT_EXPO },
      }}
    >
      <m.div
        style={{ width: "100%", height: "100%" }}
        animate={reduceMotion ? { scale: 1 } : { scale: [1, 1.022, 1] }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : {
                delay: 1.45,
                duration: 3.2,
                repeat: Infinity,
                ease: "easeInOut",
              }
        }
      >
        <svg
          className="loading-screen-svg"
          viewBox={BRAND_VIEWBOX}
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <clipPath id={clipId}>
              <path d={LEFT_WING_PATH} />
              <path d={RIGHT_WING_PATH} />
            </clipPath>
            <linearGradient id={sheenId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--portfolio-paper)" stopOpacity="0" />
              <stop offset="35%" stopColor="var(--portfolio-paper)" stopOpacity="0.12" />
              <stop offset="50%" stopColor="var(--portfolio-paper)" stopOpacity="0.34" />
              <stop offset="65%" stopColor="var(--portfolio-paper)" stopOpacity="0.12" />
              <stop offset="100%" stopColor="var(--portfolio-paper)" stopOpacity="0" />
            </linearGradient>
          </defs>

          <m.g
            animate={reduceMotion ? { opacity: 1 } : { opacity: [1, 0.74, 1, 1] }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : {
                    delay: 1.45,
                    duration: 3.2,
                    times: [0, 0.35, 0.7, 1],
                    repeat: Infinity,
                    ease: "easeInOut",
                  }
            }
          >
            <m.path
              d={LEFT_WING_PATH}
              fill="currentColor"
              stroke="currentColor"
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0.08, fillOpacity: 0.08, strokeOpacity: 0.9 }}
              animate={{ pathLength: 1, fillOpacity: 1, strokeOpacity: 0 }}
              transition={
                reduceMotion
                  ? { duration: 0.15 }
                  : {
                      pathLength: { delay: 0.04, duration: 1.0, ease: EASE_OUT_EXPO },
                      fillOpacity: { delay: 0.64, duration: 0.52, ease: EASE_OUT_EXPO },
                      strokeOpacity: { delay: 0.9, duration: 0.42, ease: "easeOut" },
                    }
              }
            />
          </m.g>

          <m.g
            animate={reduceMotion ? { opacity: 1 } : { opacity: [1, 1, 0.74, 1] }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : {
                    delay: 1.45,
                    duration: 3.2,
                    times: [0, 0.3, 0.65, 1],
                    repeat: Infinity,
                    ease: "easeInOut",
                  }
            }
          >
            <m.path
              d={RIGHT_WING_PATH}
              fill="currentColor"
              stroke="currentColor"
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0.08, fillOpacity: 0.08, strokeOpacity: 0.9 }}
              animate={{ pathLength: 1, fillOpacity: 1, strokeOpacity: 0 }}
              transition={
                reduceMotion
                  ? { duration: 0.15 }
                  : {
                      pathLength: { delay: 0.2, duration: 0.9, ease: EASE_OUT_EXPO },
                      fillOpacity: { delay: 0.8, duration: 0.52, ease: EASE_OUT_EXPO },
                      strokeOpacity: { delay: 1.02, duration: 0.42, ease: "easeOut" },
                    }
              }
            />
          </m.g>

          <g clipPath={`url(#${clipId})`}>
            <m.g
              initial={{ x: -560, opacity: 0 }}
              animate={
                reduceMotion
                  ? { x: -560, opacity: 0 }
                  : { x: [-560, 1080], opacity: [0, 1, 1, 0] }
              }
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : {
                      delay: 1.45,
                      duration: 2.2,
                      times: [0, 0.15, 0.85, 1],
                      repeat: Infinity,
                      repeatDelay: 1.0,
                      ease: EASE_SHEEN,
                    }
              }
            >
              <rect
                x={0}
                y={-180}
                width={220}
                height={1080}
                transform="skewX(30)"
                fill={`url(#${sheenId})`}
              />
            </m.g>
          </g>
        </svg>
      </m.div>
    </m.div>
  );
}

function LoadingOverlay({
  prefersReducedMotion,
}: {
  prefersReducedMotion: boolean | null;
}) {
  // Mounted for the full initial load AND AnimatePresence exit animation,
  // so scroll remains locked until the exit transition unmounts this overlay.
  useEffect(() => lockPageScroll(), []);

  const reduceMotion = Boolean(prefersReducedMotion);

  return (
    <m.div
      className="loading-screen"
      initial={{ opacity: 1 }}
      exit={{
        opacity: 0,
        clipPath: reduceMotion
          ? "circle(150% at 50% 50%)"
          : "circle(0% at 50% 50%)",
        transition: {
          duration: reduceMotion ? 0.2 : 1.15,
          ease: EASE_OUT_EXPO,
        },
      }}
      style={{ clipPath: "circle(150% at 50% 50%)" }}
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading site"
    >
      <BrandLogoMotion reduceMotion={reduceMotion} />
    </m.div>
  );
}

export default function LoadingScreen({
  minDuration = 5000,
  maxDuration = 15000,
  ready = true,
  hold = false,
}: LoadingScreenProps) {
  const [assetsReady, setAssetsReady] = useState(false);
  const [minElapsed, setMinElapsed] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const isLoading = hold || !(ready && assetsReady && minElapsed);

  // Minimum display time
  useEffect(() => {
    const id = window.setTimeout(() => setMinElapsed(true), minDuration);
    return () => window.clearTimeout(id);
  }, [minDuration]);

  // Wait for window load, fonts, and non-lazy images
  useEffect(() => {
    let cancelled = false;

    const windowLoaded = new Promise<void>((resolve) => {
      if (document.readyState === "complete") resolve();
      else window.addEventListener("load", () => resolve(), { once: true });
    });

    const fontsLoaded = document.fonts?.ready ?? Promise.resolve();

    Promise.all([windowLoaded, fontsLoaded])
      .then(() =>
        Promise.all(
          Array.from(document.images)
            .filter((img) => img.loading !== "lazy" && !img.complete)
            .map((img) => img.decode().catch(() => undefined))
        )
      )
      .then(() => {
        if (!cancelled) setAssetsReady(true);
      });

    // Safety net so a failed asset can never trap the user
    const fallback = window.setTimeout(() => {
      if (!cancelled) setAssetsReady(true);
    }, maxDuration);

    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
    };
  }, [maxDuration]);

  return (
    <AnimatePresence>
      {isLoading ? (
        <LoadingOverlay
          key="loading-screen"
          prefersReducedMotion={prefersReducedMotion}
        />
      ) : null}
    </AnimatePresence>
  );
}
