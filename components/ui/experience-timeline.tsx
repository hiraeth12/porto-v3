export { default as Timeline, type TimelineProps } from "@/components/ui/timeline";

export type TimelineEntry = {
  period: string;
  title: string;
  description: string;
  detail: string;
};

export type ExperienceTimelineProps = {
  entries: TimelineEntry[];
};

export default function ExperienceTimeline({ entries }: ExperienceTimelineProps) {
  return (
    <ol className="experience-timeline" aria-label="Experience timeline">
      {entries.map((entry) => (
        <li className="experience-timeline-item" key={`${entry.period}-${entry.title}`}>
          <div className="experience-timeline-marker" aria-hidden="true" />
          <article className="experience-timeline-card">
            <div className="experience-timeline-meta">
              <time className="tabular-nums">{entry.period}</time>
              <span>{entry.detail}</span>
            </div>
            <h3 className="text-balance">{entry.title}</h3>
            <p>{entry.description}</p>
          </article>
        </li>
      ))}
    </ol>
  );
}
