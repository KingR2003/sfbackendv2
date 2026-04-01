import React from 'react'

function Input({label, placeholder, type='text'}){
  return (
    <label className="input-group">
      <span className="input-label">{label}</span>
      <input type={type} placeholder={placeholder} />
    </label>
  )
}

export default function Signup(){
  return (
    <section className="signup">
      <div className="signup-card container">
        <div className="signup-left">
          <div className="hero-image" style={{backgroundImage: `url('/assets/hero.jpg')`}} aria-hidden="true" />
        </div>
        <div className="signup-right">
          <div className="signup-right-inner">
            <h2>Create Account</h2>
            <p className="muted">Already have an account? <a href="#">Sign in</a></p>
            <form className="signup-form" onSubmit={e => e.preventDefault()}>
              <Input label="Full Name" placeholder="Your Name" />
              <Input label="Email Address" placeholder="you@example.com" type="email" />
              <Input label="Password" placeholder="********" type="password" />
              <Input label="Confirm Password" placeholder="********" type="password" />
              <button className="btn-primary">Create Account →</button>
            </form>
            <div className="divider">Or join with</div>
            <div className="social-buttons">
              <button className="btn-outline">Google</button>
              <button className="btn-outline">Facebook</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
