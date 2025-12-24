/* ======================
   3D MODEL PAGE
====================== */

.model-page {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  max-width: 1200px;
  margin: auto;
  padding: 3rem 1.5rem;
}

.viewer-container {
  background: #fff;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

#viewer {
  width: 100%;
  height: 500px;
  display: block;
}

.model-info {
  background: #fff;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.08);
}

.model-info h2 {
  margin-bottom: 0.5rem;
}

.model-info .price {
  font-weight: bold;
  margin-bottom: 1rem;
}

.materials {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.8rem;
  margin-top: 1rem;
}

.materials button {
  padding: 0.7rem;
  border: none;
  border-radius: 8px;
  background: #ddd;
  color: #666;
  cursor: not-allowed;
}

.note {
  font-size: 0.9rem;
  opacity: 0.7;
  margin-top: 1rem;
}

/* Mobile */
@media (max-width: 900px) {
  .model-page {
    grid-template-columns: 1fr;
  }

  #viewer {
    height: 350px;
  }
}
