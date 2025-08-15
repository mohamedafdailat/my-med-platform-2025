import React from 'react';

const Card = ({ title, description, image, action }) => {
  return (
    <div className="feature-card">
      {image && <img src={image} alt={title} className="card-image" loading="lazy" />}
      <h3>{title}</h3>
      <p>{description}</p>
      {action && <div className="card-action">{action}</div>}
    </div>
  );
};

export default Card;