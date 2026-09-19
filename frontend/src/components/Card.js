import React from 'react';

const Card = ({ title, description, image, icon, action, onErrorImage = '/logo192.png' }) => {
  return (
    <div className="feature-card">
      {image && (
        <img
          src={image}
          alt={title}
          className="card-image"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = onErrorImage;
          }}
        />
      )}
      {icon && <div className="feature-card-icon">{icon}</div>}
      <h3>{title}</h3>
      <p>{description}</p>
      {action && <div className="card-action">{action}</div>}
    </div>
  );
};

export default Card;
