import { useState } from "react";

export function JobCard({ job }) {
  const [expanded, setExpanded] = useState(false);
  const { image_url, title, description, status } = job;

  return (
    <div className="job-card">
      <div className="job-card__main">
        <img
          src={image_url}
          alt=""
          aria-hidden="true"
          className="job-card__icon"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
        <div className="job-card__info">
          <p className="job-card__title">{title}</p>
          <p className="job-card__description">
            {expanded ? description : `${description.slice(0, 40)}...`}
          </p>
          <button
            className="job-card__expand"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Ver menos" : "Ver más"}
          </button>
        </div>
        <span className={`job-card__status ${status === "PENDIENTE" ? "status--pending" : "status--done"}`}>
          {status === "PENDIENTE" ? "Pendiente" : "Finalizado"}
        </span>
      </div>
    </div>
  );
}