import React from 'react';

const AtsStandardTemplate = ({ data }) => {
  if (!data) return null;

  const {
    basics = {},
    summary = '',
    education = [],
    technicalSkills = [],
    projects = [],
    workExperience = [],
    positionOfResponsibility = [],
    achievements = []
  } = data;

  const formatUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://${url}`;
  };

  return (
    <div className="ats-template-container">
      <style>{`
        .ats-template-container {
          font-family: 'Times New Roman', Times, Georgia, serif;
          font-size: 11px;
          line-height: 1.35;
          color: #000000 !important;
          background-color: #ffffff !important;
          padding: 24px;
          box-sizing: border-box;
          text-align: left;
          width: 100%;
          min-height: 100%;
          display: block;
        }
        .ats-name {
          font-size: 20px;
          font-weight: bold;
          text-align: center;
          text-transform: uppercase;
          margin: 0 0 4px 0;
          color: #000000 !important;
        }
        .ats-contact {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          font-size: 10px;
          color: #444444 !important;
        }
        .ats-contact span {
          color: #444444 !important;
        }
        .ats-section-title {
          font-size: 11px;
          font-weight: bold;
          text-transform: uppercase;
          margin-top: 14px;
          margin-bottom: 4px;
          border-bottom: 1px solid #000000;
          padding-bottom: 2px;
          color: #000000 !important;
        }
        .ats-entry-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          font-weight: bold;
          font-size: 11px;
          margin-top: 5px;
          color: #000000 !important;
        }
        .ats-entry-subheader {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          font-style: italic;
          font-weight: normal;
          font-size: 11px;
          margin-bottom: 4px;
          color: #333333 !important;
        }
        .ats-bullet-list {
          list-style-type: disc;
          margin: 3px 0 6px 0;
          padding-left: 18px;
        }
        .ats-bullet-item {
          font-size: 10.5px;
          margin-bottom: 2px;
          text-align: justify;
          color: #000000 !important;
          line-height: 1.3;
        }
        .ats-summary-text {
          font-size: 10.5px;
          margin: 0 0 8px 0;
          text-align: justify;
          color: #000000 !important;
          line-height: 1.35;
        }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <h1 className="ats-name">
          {basics.name || 'Your Name'}
        </h1>
        <div className="ats-contact">
          {basics.phone && <span style={{ color: '#444444' }}>{basics.phone}</span>}
          {basics.phone && basics.email && <span style={{ color: '#444444' }}>|</span>}
          {basics.email && (
            <a href={`mailto:${basics.email}`} style={{ color: '#444444', textDecoration: 'none' }}>
              {basics.email}
            </a>
          )}
          {basics.email && basics.linkedin && <span style={{ color: '#444444' }}>|</span>}
          {basics.linkedin && (
            <a href={formatUrl(basics.linkedin)} target="_blank" rel="noopener noreferrer" style={{ color: '#444444', textDecoration: 'underline' }}>
              LinkedIn
            </a>
          )}
          {basics.linkedin && basics.github && <span style={{ color: '#444444' }}>|</span>}
          {basics.github && (
            <a href={formatUrl(basics.github)} target="_blank" rel="noopener noreferrer" style={{ color: '#444444', textDecoration: 'underline' }}>
              GitHub
            </a>
          )}
          {basics.github && basics.portfolio && <span style={{ color: '#444444' }}>|</span>}
          {basics.portfolio && (
            <a href={formatUrl(basics.portfolio)} target="_blank" rel="noopener noreferrer" style={{ color: '#444444', textDecoration: 'underline' }}>
              Portfolio
            </a>
          )}
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div style={{ marginBottom: '12px' }}>
          <h2 className="ats-section-title">Summary</h2>
          <p className="ats-summary-text">{summary}</p>
        </div>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <h2 className="ats-section-title">Education</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {education.map((edu, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="ats-entry-header">
                  <span>{edu.institution}</span>
                  <span>{edu.dates}</span>
                </div>
                <div className="ats-entry-subheader">
                  <span>{edu.degree}{edu.gpa ? ` | GPA: ${edu.gpa}` : ''}</span>
                  <span>{edu.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Technical Skills */}
      {technicalSkills && technicalSkills.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <h2 className="ats-section-title">Technical Skills</h2>
          <ul className="ats-bullet-list">
            {technicalSkills.map((skillGroup, idx) => (
              <li key={idx} className="ats-bullet-item">
                <strong>{skillGroup.category}:</strong>{' '}
                <span>{skillGroup.skills.join(', ')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <h2 className="ats-section-title">Projects</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {projects.map((proj, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="ats-entry-header">
                  <span>
                    {proj.name}
                    {(proj.githubUrl || proj.liveUrl) && (
                      <span style={{ fontWeight: 'normal', marginLeft: '6px', fontSize: '9.5px', textTransform: 'none' }}>
                        (
                        {proj.githubUrl && (
                          <a href={formatUrl(proj.githubUrl)} target="_blank" rel="noopener noreferrer" style={{ color: '#444444', textDecoration: 'underline', marginRight: proj.liveUrl ? '4px' : '0' }}>
                            GitHub
                          </a>
                        )}
                        {proj.githubUrl && proj.liveUrl && '| '}
                        {proj.liveUrl && (
                          <a href={formatUrl(proj.liveUrl)} target="_blank" rel="noopener noreferrer" style={{ color: '#444444', textDecoration: 'underline' }}>
                            Link
                          </a>
                        )}
                        )
                      </span>
                    )}
                  </span>
                  <span>{proj.dates}</span>
                </div>
                {proj.tools && (
                  <div style={{ fontStyle: 'italic', fontSize: '10px', marginTop: '2px', marginBottom: '4px', color: '#444444' }}>
                    – Tools Used: {proj.tools}
                  </div>
                )}
                {proj.descriptionBullets && proj.descriptionBullets.length > 0 && (
                  <ul className="ats-bullet-list">
                    {proj.descriptionBullets.map((bullet, bIdx) => (
                      <li key={bIdx} className="ats-bullet-item">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Work Experience */}
      {workExperience && workExperience.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <h2 className="ats-section-title">Work Experience</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {workExperience.map((work, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="ats-entry-header">
                  <span>{work.role}</span>
                  <span>{work.dates}</span>
                </div>
                <div className="ats-entry-subheader">
                  <span>{work.company}</span>
                  <span>{work.location}</span>
                </div>
                {work.bullets && work.bullets.length > 0 && (
                  <ul className="ats-bullet-list">
                    {work.bullets.map((bullet, bIdx) => (
                      <li key={bIdx} className="ats-bullet-item">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Position of Responsibility */}
      {positionOfResponsibility && positionOfResponsibility.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <h2 className="ats-section-title">Position of Responsibility</h2>
          <ul className="ats-bullet-list">
            {positionOfResponsibility.map((item, idx) => (
              <li key={idx} className="ats-bullet-item">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Achievements */}
      {achievements && achievements.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <h2 className="ats-section-title">Achievements</h2>
          <ul className="ats-bullet-list">
            {achievements.map((item, idx) => (
              <li key={idx} className="ats-bullet-item">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AtsStandardTemplate;
