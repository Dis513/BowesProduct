<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Models – BowesProduct</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="style.css">

  <script>
    function setTheme(theme) {
      document.body.className = "theme-" + theme;
      localStorage.setItem("theme", theme);
    }
    window.onload = () => {
      setTheme(localStorage.getItem("theme") || "blue");
    };
  </script>
</head>

<body>

<nav class="top-nav">
  <div>BowesProduct</div>
  <div class="nav-right">
    <a href="index.html">Home</a>
    <a href="icons.html">Icons</a>
    <a href="models.html">Models</a>
  </div>
</nav>

<header class="hero">
  <h1>3D Models</h1>
  <p>Commercial-ready 3D assets coming soon</p>
</header>

<section>
  <div class="products">
    <div class="card" style="opacity:.4">Model Viewer – Coming Soon</div>
    <div class="card" style="opacity:.4">Material Selector – Coming Soon</div>
    <div class="card" style="opacity:.4">AI Generated Models – Coming Soon</div>
  </div>
</section>

<footer>
  <p>© 2025 BowesProduct</p>
</footer>

</body>
</html>
