const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { Client } = require("podcast-api");

const app = express();
const port = 5000;
const cors = require("cors");
const API_URL = "https://api.spotify.com/v1/browse/categories";

let users = [];
app.use(cors());
app.use(bodyParser.json()); // middleware
const client = Client({ apiKey: "6dc258466e3d461bb9eb42475ec41916" });
async function getBestPodcasts() {
  try {
    const response = await client.fetchBestPodcasts({
      genre_id: "93",
      page: 2,
      region: "us",
      sort: "listen_score",
      safe_mode: 0,
    });
    return response.data;
  } catch (error) {
    throw new Error(error);
  }
}

async function listpodcastsgenres() {
  try {
    const response = await client.fetchPodcastGenres({
      top_level_only: 1,
    });
    return response.data;
  } catch (error) {
    throw new Error(error);
  }
}

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const user = users.find((user) => user.email === email);
  if (!user) {
    return res.status(400).json({ error: "User not found" });
  }

  try {
    if (await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ email }, "secret");
      console.log("true");
      return res.json({ success: true, token });
    } else {
      return res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/signup", async (req, res) => {
  const { email, password } = req.body;

  if (users.find((user) => user.email === email)) {
    return res.status(400).json({ error: "User already exists" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ email, password: hashedPassword });
    const token = jwt.sign({ email }, "secret");
    console.log(users);
    return res.json({ success: true, token });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/shows", async (req, res) => {
  try {
    const accessToken =
      "BQCg3fNN4Byljr-UqxWN7PRGlW6vZGyA70eAgulttZw4WbYs1QC85_GQKpwAu7bc5iSnazStfBiV-maXeXXPA0TXtHUG510KEcZdrK-NhXpudOGk3lPxf81v_kObxWjE9trH0lbqai612M-mAwOLVlUsPVwHFmGVl_ptXePqu6PD7G0YC4MuKzdYniouIAQgZhRrOf9iNN7uUWkbomUN4ntakVrMTWFfXT8FKw4rgae6Ckzd4z9tFxKsvdjRN-3HZdgvWx4_SMA"; // your access token here
    const response = await axios.get(API_URL, {
      headers: {
        Authorization: "Bearer " + accessToken,
      },
    });
    const data = response.data;
    res.send(data);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "An error occurred" });
  }
});

app.get("/best-podcasts", async (req, res) => {
  try {
    const podcasts = await getBestPodcasts();
    res.json(podcasts);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
});
app.get("/list-podcasts-genres", async (req, res) => {
  try {
    const podcasts = await listpodcastsgenres();
    res.json(podcasts);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
});

app.get("/podcasts/:id", (req, res) => {
  const id = req.params.id;
  const options = {
    id,
    next_episode_pub_date: 1479154463000,
    sort: "recent_first",
  };

  // Fetch the podcast with the specified ID
  client
    .fetchPodcastById(options)
    .then((response) => {
      console.log(response.data);
      res.json(response.data);
      //console.log(response.data.episodes[0].audio);
    })
    .catch((error) => {
      console.error("Failed to retrieve podcast:", error);
      res.status(500).send("Internal server error");
    });
});

app.get("/search", (req, res) => {
  const searchTerm = req.query.q;
  const client = Client({ apiKey: "6dc258466e3d461bb9eb42475ec41916" });
  client
    .search({
      q: searchTerm,
      sort_by_date: 0,
      type: "episode",
      offset: 0,
      len_min: 10,
      len_max: 30,
      genre_ids: "68,82",
      published_before: 1580172454000,
      published_after: 0,
      only_in: "title,description",
      language: "English",
      safe_mode: 0,
      unique_podcasts: 0,
      page_size: 10,
    })
    .then((response) => {
      // Get response json data here
      console.log(response.data);
      res.send(response.data);
    })
    .catch((error) => {
      console.log(error);
    });
});

app.listen(port, () => {
  console.log("listening on port");
});
