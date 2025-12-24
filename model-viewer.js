<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Werewolf 3D Viewer</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />

  <!-- ✅ ONLY MODULE VERSION -->
  <script type="module"
    src="https://unpkg.com/@google/model-viewer@3.5.0/dist/model-viewer.min.js">
  </script>

  <style>
    body {
      margin: 0;
      font-family: system-ui, sans-serif;
      background: #020617;
      color: white;
    }

    .model-container {
      width: 100%;
      max-width: 1100px;
      height: 600px;
      margin: 3rem auto;
      border-radius: 16px;
      overflow: hidden;
      background: #020617;
      box-shadow: 0 20px 40px rgba(0,0,0,.4);
    }

    model-viewer {
      width: 100%;
      height: 100%;
    }

    .progress-message {
      color: white;
      font-size: 1.3rem;
      padding: 2rem;
      text-align: center;
    }
  </style>
</head>

<body>

<div class="model-container">
  <model-viewer
    src="./models/werewolf.glb"
    alt="3D Werewolf"
    camera-controls
    auto-rotate
    loading="eager"
    exposure="1"
    shadow-intensity="1"
    environment-image="neutral"
    crossorigin="anonymous"
  >
    <div slot="progress-bar" class="progress-message">
      Loading Werewolf…
    </div>
  </model-viewer>
</div>

</body>
</html>
