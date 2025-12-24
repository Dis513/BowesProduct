<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Werewolf 3D Model – BowesProduct</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />

  <script type="module" src="https://unpkg.com/@google/model-viewer@3.5.0/dist/model-viewer.min.js"></script>
  <link rel="stylesheet" href="style.css" />

  <style>
    .model-container {
      background: #020617;
      border-radius: 16px;
      max-width: 1100px;
      height: 600px;
      margin: 3rem auto;
      overflow: hidden;
    }

    model-viewer {
      width: 100%;
      height: 100%;
    }

    .progress-message {
      color: white;
      font-size: 1.2rem;
      text-align: center;
      padding: 2rem;
    }
  </style>
</head>
<body class="theme-blue">
  <div class="model-container">
    <model-viewer
      src="./models/werewolf.glb"
      alt="Werewolf 3D Model"
      shadow-intensity="1"
      camera-controls
      auto-rotate
      exposure="1"
      environment-image="neutral"
      crossorigin="anonymous"
    >
      <div slot="progress-bar" class="progress-message">Loading Werewolf…</div>
    </model-viewer>
  </div>
</body>
</html>
