import React from 'react';
import { Link } from 'react-router-dom';

export default function BrandLogo({ to = '/', className = '' }) {
  return (
    <Link to={to} className={`logo brand-logo ${className}`.trim()} aria-label="GoldChain">
      <span className="logo-mark" aria-hidden="true">
        <span className="logo-mark-letter">G</span>
        <span className="logo-mark-chain">
          <span />
          <span />
        </span>
      </span>
      <span className="logo-wordmark">
        <span className="logo-text">
          <strong>GOLD</strong>
          <em>CHAIN</em>
        </span>
        <span className="logo-subline">O2O GOLD ASSETS</span>
      </span>
    </Link>
  );
}
