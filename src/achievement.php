<?php

session_start();

if (isset($_SESSION["user_id"])) {

  $mysqli = require __DIR__ . "/loginWithScore/database.php";

  $sql = "SELECT * FROM users
            WHERE id = {$_SESSION["user_id"]}";

  $result = $mysqli->query($sql);

  $user = $result->fetch_assoc();

  $numOfAchievement = 0;
}

?>

<!DOCTYPE html>
<html lang="en">

<style>
  div {
    margin: 5px;
    border: 0;
    padding: 0;
  }
</style>

<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>CSE5911 Capstone Achievement Page</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@48,600,0,0" />
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-GLhlTQ8iRABdZLl6O3oVMWSktQOp6b7In1Zl3/Jr59b6EGGoI1aFkw7cmDA6j6gD" crossorigin="anonymous">
</head>

<body>
  <div class="container">


    <div class="container-fluid py-2">
      <h1 class="font-weight-light">Your Achievement Garden</h1>
      <br><br>

      <div class="d-flex flex-row flex-nowrap">
        <?php if ($user["score"] > 0) : ?>
          <div class="login-card">
            <h1>Get Your First Point</h1>
            <br>
            <form class="login-card-form">
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-1-square-fill" viewBox="0 0 16 16">
                <path d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2Zm7.283 4.002V12H7.971V5.338h-.065L6.072 6.656V5.385l1.899-1.383h1.312Z" />
              </svg>

              <p>You Got Your First Point!</p>


            </form>
          </div>
        <?php endif; ?>

        <?php if ($user["score"] >= 5) : ?>

          <div class="login-card">
            <h1>Excellent Try</h1>
            <br>
            <form class="login-card-form">
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-5-square-fill" viewBox="0 0 16 16">
                <path d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2Zm5.994 12.158c-1.57 0-2.654-.902-2.719-2.115h1.237c.14.72.832 1.031 1.529 1.031.791 0 1.57-.597 1.57-1.681 0-.967-.732-1.57-1.582-1.57-.767 0-1.242.45-1.435.808H5.445L5.791 4h4.705v1.103H6.875l-.193 2.343h.064c.17-.258.715-.68 1.611-.68 1.383 0 2.561.944 2.561 2.585 0 1.687-1.184 2.806-2.924 2.806Z" />
              </svg>

              <p>You Got 5 Points!</p>


            </form>
          </div>
        <?php endif; ?>

      </div>
    </div>
    <hr class="my-4">

    <a id="game-trial" href="javascript:history.back()" role="button">Back</a>
  </div>
</body>

</html>