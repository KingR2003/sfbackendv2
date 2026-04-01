import React from 'react'

export default function Header(){
  return (
    <header className="site-header">
      <div className="nav container">
        <div className="logo">
          <img src="/assets/logo.png" alt="Svasthya Fresh" />
        </div>
        <nav className="nav-links">
          <a href="#">Home</a>
          <a href="#">Products</a>
          <a href="#">Our Story</a>
          <a href="#">Contact</a>
        </nav>
        <div className="nav-actions">
          <button className="icon-btn">🔍</button>
          <button className="icon-btn">🛒</button>
        </div>
      </div>
    </header>
  )
}
