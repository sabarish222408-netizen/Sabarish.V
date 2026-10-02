const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json()); // allows server to read JSON sent from frontend

// Test route
app.get('/', (req, res) => {
  res.send('Alcohol Testing Backend is running!');
});

// BAC calculation route
app.post('/calculate-bac', (req, res) => {
  const { gender, weight, drinks, hours } = req.body;

  const genderConstant = gender === 'male' ? 0.68 : 0.55;
  const alcoholGrams = drinks * 14;
  const weightGrams = weight * 1000;

  let bac = (alcoholGrams / (weightGrams * genderConstant)) * 100;
  bac = bac - (0.015 * hours);
  if (bac < 0) bac = 0;
  bac = bac.toFixed(3);

  const legalLimit = 0.08;
  const status = bac >= legalLimit ? 'Unsafe to drive' : 'Safe to drive';

  res.json({ bac, status });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
