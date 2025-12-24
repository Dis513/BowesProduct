<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Werewolf 3D Model – BowesProduct</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <!-- Google Model Viewer: BOTH scripts for full compatibility -->
  <script type="module" src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"></script>
  <script nomodule src="https://unpkg.com/@google/model-viewer/dist/model-viewer-legacy.js"></script>

  <link rel="stylesheet" href="style.css" />

  <style>
    .model-container {
      width: 100%;
      max-width: 1100px;
      margin: 3rem auto;
      height: 600px;
      border-radius: 16px;
      overflow: hidden;
      background: #020617;
      box-shadow: 0 20px 40px rgba(0,0,0,0.2);
    }

    model-viewer {
      width: 100%;
      height: 100%;
      background-color: #020617;
    }

    /* Custom loading progress bar */
    model-viewer::part(default-progress-bar) {
      background: rgba(0, 0, 0, 0.8) !important;
      backdrop-filter: blur(10px);
      display: flex !important;
      align-items: center;
      justify-content: center;
    }

    .progress-message {
      color: white;
      font-size: 1.4rem;
      text-align:  center;
      padding: 2rem;
    }

    .model-info {
      max-width: 1100px;
      margin: 2rem auto;
      padding: 0 2rem;
      text-align: center;
    }

    .price {
      font-size: 1.8rem;
      color: var(--primary, #2563eb);
      font-weight: bold;
      margin: 1rem 0;
    }
  </style>
</head>
<body class="theme-blue">

<header class="site-header">
  <div class="header-inner">
    <div class="logo">BowesProduct</div>
    <nav class="main-nav">
      <a href="index.html">Home</a>
      <a href="icons.html">Icons</a>
      <a href="models.html" class="active">Models</a>
    </nav>
  </div>
</header>

<section class="hero">
  <h1>Werewolf 3D Model</h1>
  <p>High-quality, commercial-ready GLB model</p>
</section>

<div class="model-container">
  <model-viewer 
    src="models/werewolf.glb" 
    alt="Werewolf 3D Model"
    loading="eager"
    auto-rotate 
    camera-controls 
    shadow-intensity="1"
    exposure="1"
    ar
    ar-modes="webxr scene-viewer quick-look">
    
    <div class="progress-message" slot="progress-bar">
      Loading Werewolf model...
    </div>
  </model-viewer>
</div>

<div class="model-info">
  <h2>€49 — Commercial License</h2>
  <p class="price">One-time purchase</p>
  <ul style="text-align:left; max-width:600px; margin:2rem auto;">
    <li>GLB format (optimized for web & apps)</li>
    <li>Commercial usage allowed</li>
    <li>PBR materials & rigging ready</li>
    <li>Immediate download after purchase</li>
  </ul>
  <a href="#" class="btn">Buy Model (Coming Soon)</a>
</div>

<footer class="site-footer">
  <nav class="footer-nav">
    <a href="about.html">About</a>
    <a href="license.html">License</a>
    <a href="privacy.html">Privacy</a>
    <a href="terms.html">Terms</a>
    <a href="refund.html">Refunds</a>
  </nav>
  <p class="copyright">© 2025 BowesProduct. All rights reserved.</p>
</footer>

<script>
  window.addEventListener('load', () => {
    const savedTheme = localStorage.getItem("theme") || "blue";
    document.body.className = "theme-" + savedTheme;
  });
</script>

</body>
</html>
