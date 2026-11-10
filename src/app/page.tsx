import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      {/* Header */}
      <header>
        <div className="logo">CAF INTERIORS</div>
        <nav>
          <Link href="#home">Home</Link>
          <Link href="#about">About Us</Link>
          <Link href="#mission">Our Mission</Link>
          <Link href="#vision">Our Vision</Link>
          <Link href="#contact">Contact</Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section id="home" className="hero">
        <div className="content">
          <h1>CAF INTERIORS</h1>
          <h2>Transforming Spaces.<br />Elevating Living.</h2>
          <p>We create beautiful, functional, and inspiring spaces through exceptional furniture, thoughtful interior design, and quality craftsmanship.</p>
          <a href="https://wa.me/2349030262160" className="cta">Contact Us</a>
        </div>
      </section>

      {/* About Us */}
      <section id="about">
        <h2 className="section-title">About CAF Interiors</h2>
        <p>CAF Interiors is a furniture and interior design brand committed to transforming spaces through creativity, craftsmanship, and thoughtful design.</p>
        <p>We specialize in furniture solutions, interior decoration, and customized designs that combine beauty, comfort, and functionality.</p>
        <p>Our goal is to help individuals and businesses create spaces that reflect their personality, lifestyle, and aspirations.</p>
      </section>

      {/* Mission */}
      <section id="mission">
        <h2 className="section-title">Our Mission</h2>
        <p>To transform everyday spaces into beautiful, functional, and inspiring environments by delivering quality furniture, creative interior solutions, and exceptional customer experiences.</p>
      </section>

      {/* Vision */}
      <section id="vision">
        <h2 className="section-title">Our Vision</h2>
        <p>To become a trusted and recognized brand in furniture and interior design, known for innovation, outstanding craftsmanship, timeless aesthetics, and our ability to transform the way people experience their spaces. and to become a globally recognized name in the luxury interior design world .</p>
      </section>

      {/* Under Construction */}
      <section id="construction" className="construction">
        <h2>OUR NEW WEBSITE<br />IS UNDER CONSTRUCTION</h2>
        <p>We're building something beautiful!<br /><br />Our full website is currently under development and will be launching soon.<br /><br />We're working hard to bring you a better online experience where you can discover our furniture collections, explore our interior design services, and connect with CAF Interiors more easily.<br /><br />Stay connected. Something beautiful is coming!</p>
        <div className="loader"></div>
      </section>

      {/* Contact */}
      <section id="contact">
        <h2 className="section-title">Let's Create Something Beautiful Together.</h2>
        <p>Have a furniture enquiry or an interior design project in mind? We'd love to hear from you.</p>
        <div className="contact-buttons" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href="https://wa.me/2349030262160" className="cta">WhatsApp</a>
          <a href="tel:+2349030262160" className="cta">Phone</a>
          <a href="mailto:cafinterior01@gmail.com" className="cta">Email</a>
          <a href="https://www.instagram.com/caf_interior_?vrfl=aGMwZXA5NGdlYXps" className="cta">Instagram</a>
          <a href="https://www.facebook.com/share/1JoobLxXsi/" className="cta">Facebook</a>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div>CAF INTERIORS</div>
        <div>Transforming Spaces. Elevating Living.</div>
        <nav>
          <Link href="#home">Home</Link>
          <Link href="#about">About Us</Link>
          <Link href="#mission">Mission</Link>
          <Link href="#vision">Vision</Link>
          <Link href="#contact">Contact</Link>
        </nav>
        <div>© 2026 CAF Interiors. All Rights Reserved.</div>
        <div>Our full website is coming soon.</div>
      </footer>
    </>
  );
}
