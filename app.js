const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "moviesData.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    movieName: dbObject["movie_name"],
  };
};
//Get API 1
app.get("/movies/", async (request, response) => {
  const getMoviesArray = `
    SELECT *
    FROM movie
    ORDER BY movie_id;
    `;
  const moviesArray = await database.all(getMoviesArray);
  response.send(
    moviesArray.map((eachMovie) => convertDbObjectToResponseObject(eachMovie))
  );
});
//Post API 2
app.post("/movies/", async (request, response) => {
  const moviesDetails = request.body;
  const { directorId, movieName, leadActor } = moviesDetails;
  const postMoviesQuery = `
    INSERT INTO 
    movie (director_id, movie_name, lead_actor)
    VALUES 
    (${directorId}, '${movieName}', '${leadActor}');
    `;
  const movies = await database.run(postMoviesQuery);
  const lastid = movies.lastId;
  response.send("Movie Successfully Added");
});

const convertDbObjectToResponseObjectOfget = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};

// Get API 3
app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQuery = `
    SELECT * 
    FROM movie
    WHERE 
    movie_id = ${movieId};
    `;
  const movieArr = await database.get(getMovieQuery);
  response.send(convertDbObjectToResponseObjectOfget(movieArr));
});

//Put API 4
app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const { directorId, movieName, leadActor } = request.body;
  const movieUpdatedQuery = `
    UPDATE 
    movie
    SET 
    movie_id = ${movieId},
    director_id = ${directorId},
    movie_name = '${movieName}',
    lead_actor = '${leadActor}'
    WHERE movie_id = ${movieId};
    `;
  await database.run(movieUpdatedQuery);
  response.send("Movie Details Updated");
});

//Delete API 5
app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `
  DELETE 
  FROM movie
  WHERE
  movie_id = ${movieId};
  `;
  await database.run(deleteMovieQuery);
  response.send("Movie Removed");
});

const convertDbObjectToResponseObjects = (dbObject) => {
  return {
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
  };
};

//Get API 6
app.get("/directors/", async (request, response) => {
  const directorQuery = `
    SELECT
    *
    FROM 
    director
    ORDER BY 
    director_id;
    `;
  const directorsArray = await database.all(directorQuery);
  response.send(directorsArray);
});

//Put API 7
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const { movieName } = request.body;
  const getMovieListQuery = `
    SELECT
    *
    FROM 
    movie
    WHERE 
    movie_name LIKE '%${movieName}%' OR
    director_id = ${directorId};
    `;
  const movieArray = await database.get(getMovieListQuery);
  response.send(convertDbObjectToResponseObject(movieArray));
});

module.exports = app;
