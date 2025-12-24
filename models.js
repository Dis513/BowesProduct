<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>3D Models – BowesProduct</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Three.js -->
  <script src="https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.158.0/examples/js/controls/OrbitControls.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.158.0/examples/js/loaders/GLTFLoader.js"></script>

  <link rel="stylesheet" href="style.css">
</head>

<body>

<header class="hero">
  <h1>3D Model Library</h1>
  <p>Preview professional 3D assets before purchase</p>
</header>

<section class="model-page">

  <div class="viewer-container">
    <canvas id="viewer"></canvas>
  </div>

  <div class="model-info">
    <h2>Abstract Demo Model</h2>
    <p class="price">€9 — Commercial License</p>

    <p class="desc">
      High-quality 3D asset suitable for branding, UI mockups,
      motion design, and product visuals.
    </p>

    <h3>Materials</h3>
    <div class="materials">
      <button disabled>Matte (Locked)</button>
      <button disabled>Metal (Locked)</button>
      <button disabled>Plastic (Locked)</button>
      <button disabled>Glass (Locked)</button>
    </div>

    <p class="note">
      Materials unlock after purchase.
    </p>
  </div>

</section>

<footer>
  <nav>
    <a href="index.html">Home</a>
    <a href="icons.html">Icons</a>
    <a href="privacy.html">Privacy</a>
    <a href="terms.html">Terms</a>
  </nav>
  <p>© 2025 BowesProduct</p>
</footer>

<script src="model-viewer.js"></script>
</body>
</html>
