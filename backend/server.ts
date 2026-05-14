import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT;
const riotKey = process.env.RIOT_API_KEY;

app.use(cors());
app.use(express.json());

app.get("/getPlayer", (req, res) => {
  const gameName = req.query.ign;
  const region = req.query.region;
  console.log(gameName, region) 

  res.json({
  gameName,
  region,
});
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});