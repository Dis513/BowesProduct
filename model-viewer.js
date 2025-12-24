<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Werewolf 3D Viewer</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />

  <!-- ======================
       THEME & LAYOUT CSS
  ====================== -->
  <style>
    body.theme-blue {
      --primary: #2563eb;
      --hero-bg: #eaf0ff;
      --light-bg: #f8fafc;
      --text: #0f172a;
    }

    body.theme-emerald {
      --primary: #10b981;
      --hero-bg: #d5f5e3;
      --light-bg: #ecfdf5;
      --text: #065f46;
    }

    body.theme-violet {
      --primary: #8b5cf6;
      --hero-bg: #ede9fe;
      --light-bg: #f5f3ff;
      --text: #581c87;
    }

    body.theme-amber {
      --primary: #f59e0b;
      --hero-bg: #fffbeb;
      --light-bg: #fffbeb;
      --text: #78350f;
    }

    body {
      margin: 0;
      font-family: system-ui, sans-serif;
      background: #f5f8ff;
      color: var(--text, #0f172a);
    }

    * {
      box-sizing: border-box;
    }

    /* HEADER */
    .site-header {
      background: #ffffff;
      border-bottom: 1px solid #e5e7eb;
      padding: 1rem 2rem;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-inner {
      max-width: 1200px;
      margin: auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .logo {
      font-size: 1.4rem;
      font-weight: 700;
    }

    .main-nav {
      display: flex;
      gap: 1.5rem;
    }

    .main-nav a {
      text-decoration: none;
      font-weight: 500;
      color: var(--text);
    }

    .main-nav a.active {
      color: var(--primary);
      font-weight: 700;
    }

    #themeSelect {
      padding: 0.5rem 0.8rem;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }

    /* HERO */
    .hero {
      background: var(--hero-bg);
      padding: 5rem 2rem;
      text-align: center;
    }

    .hero h1 {
      font-size: 2.6rem;
      margin-bottom: 0.8rem;
    }

    .hero p {
      font-size: 1.2rem;
      opacity: 0.85;
    }

    .btn {
      background: var(--primary);
      color: white;
      border: none;
      padding: 0.9rem 1.6rem;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 1rem;
    }

    /* MODEL VIEWER */
    .model-container {
      width: 100%;
      max-width: 1100px;
      height: 620px;
      margin: 3rem auto;
      border-radius: 18px;
      overflow: hidden;
      background: #020617;
      box-shadow: 0 25px 50px rgba(0,0,0,0.3);
      position: relative;
    }

    model-viewer {
      width: 100%;
      height: 100%;
    }

    model-viewer::part(default-progress-bar) {
      background: rgba(0,0,0,0.75);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .progress-message {
      color: white;
      font-size: 1.4rem;
      text-align: center;
      padding: 2rem;
    }

    model-viewer.error {
      background: #000;
    }

    /* FOOTER */
    .site-footer {
      background: #ffffff;
      border-top: 1px solid #e5e7eb;
      padding: 3rem 2rem;
      text-align: center;
    }

    .footer-nav {
      display: flex;
      justify-content: center;
      gap: 1.5rem;
      margin-bottom: 1rem;
    }

    @media (max-width: 768px) {
      .hero h1 {
        font-size: 2.2rem;
      }
      .model-container {
        height: 420px;
      }
    }
  </style>

  <!-- ✅ MODEL-VIEWER (MODULE ONLY — DO NOT USE LEGACY) -->
  <script
    type="module"
    src="https://unpkg.com/@google/model-viewer@3.5.0/dist/model-viewer.min.js">
  </script>
</head>

<body class="theme-emerald">

<header class="site-header">
  <div class="header-inner">
    <div class="logo">Werewolf Viewer</div>

    <nav class="main-nav">
      <a href="#hero" class="active">Home</a>
      <a href="#viewer">Viewer</a>
    </nav>

    <select id="themeSelect">
      <option value="theme-emerald">Emerald</option>
      <option value="theme-blue">Blue</option>
      <option value="theme-violet">Violet</option>
      <option value="theme-amber">Amber</option>
    </select>
  </div>
</header>

<section id="hero" class="hero">
  <h1>Inspect the Werewolf Model</h1>
  <p>Spin, zoom, and explore the 3D werewolf directly in your browser.</p>
  <button class="btn">Primary CTA</button>
</section>

<section id="viewer">
  <h2 style="text-align:center;">3D Werewolf Preview</h2>

  <div class="model-container">
    <model-viewer
      id="werewolfViewer"
      src="./models/werewolf.glb"
      poster="./werewolf.jpg"
      alt="3D Werewolf"
      camera-controls
      auto-rotate
      loading="eager"
      exposure="1"
      shadow-intensity="1"
      environment-image="neutral"
      crossorigin="anonymous"
    >
      <!-- Loading UI -->
      <div slot="progress-bar" class="progress-message">
        Loading werewolf model…
      </div>

      <!-- Error / Poster UI -->
      <div slot="poster" class="progress-message">
        <strong>3D Preview Unavailable</strong><br />
        Please refresh or try another device.
      </div>
    </model-viewer>
  </div>
</section>

<footer class="site-footer">
  <div class="footer-nav">
    <a href="#hero">Home</a>
    <a href="#viewer">Viewer</a>
  </div>
  <div>&copy; 2025 Werewolf Viewer</div>
</footer>

<!-- ======================
     JS: Theme + Error Handling
====================== -->
<script>
  const select = document.getElementById('themeSelect');
  const viewer = document.getElementById('werewolfViewer');

  select.addEventListener('change', () => {
    document.body.className = select.value;
  });

  viewer.addEventListener('load', () => {
    console.log('✅ Werewolf GLB loaded successfully');
  });

  viewer.addEventListener('error', (e) => {
    console.error('❌ Failed to load GLB:', e);
    viewer.classList.add('error');
  });
</script>

</body>
</html>
