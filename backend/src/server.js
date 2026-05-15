import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app  = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// TODO: mount controllers here

app.listen(port, () => console.log(`LaburApp backend running at http://localhost:${port}`));
