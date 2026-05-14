import React from 'react'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="brand">
          <img src="/assets/logo.png" alt="Svasthya Fresh" />
          <p>Bringing nature's finest to your doorstep. We believe in purity, authenticity, and health.</p>
        </div>
        <div className="links">
          <h4>Quick Links</h4>
          <ul>
            <li>Home</li>
            <li>Shop</li>
            <li>Our Story</li>
            <li>Contact</li>
          </ul>
        </div>
        <div className="legal">
          <h4>Legal</h4>
          <ul>
            <li>Privacy Policy</li>
            <li>Terms of Service</li>
            <li>Shipping Policy</li>
            <li>Returns</li>
          </ul>
        </div>
      </div>
      <img src="/assets/footer.png" alt="market illustration" className="footer-illustration" />
      <div className="footer-bottom container">© 2026 Svasthya Fresh. All rights reserved.</div>
    </footer>
  )
}
