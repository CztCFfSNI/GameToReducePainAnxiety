<?php


if ($_SERVER["REQUEST_METHOD"] === "POST") {

    $mysqli = require __DIR__ . "/database.php";

    $sql = sprintf(
        "SELECT * FROM users
                    WHERE email = '%s'",
        $mysqli->real_escape_string($_POST["email"])
    );

    $result = $mysqli->query($sql);

    $user = $result->fetch_assoc();

    session_start();

    session_regenerate_id();

    $_SESSION["user_id"] = $user["id"];

    if ($user) {

        if ($_POST["password"] == $user["password"]) {

            //die("success");
            session_start();

            session_regenerate_id();

            $_SESSION["user_id"] = $user["id"];

            header("Location: index.php");
            exit;
        }
    }
}

?>
<!DOCTYPE html>
<html>

<head>
    <title>Login</title>
    <meta charset="UTF-8">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../style.css">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@48,600,0,0" />
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-GLhlTQ8iRABdZLl6O3oVMWSktQOp6b7In1Zl3/Jr59b6EGGoI1aFkw7cmDA6j6gD" crossorigin="anonymous">
    <!-- <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.css"> -->
</head>

<body>
    <div class="login-card-container">
        <div class="login-card">
            <div class="login-card-header">
                <h1>Log In</h1>
            </div>
            <form class="login-card-form" method="post">
                <div class="form-item">
                    <label for="email">email</label>
                    <input type="email" name="email" id="email" value="<?= htmlspecialchars($_POST["email"] ?? "") ?>">
                </div>
                <div class="form-item">
                    <label for="password">Password</label>
                    <input type="password" name="password" id="password">
                </div>

                <button>Log in</button>

                <div class="login-card-footer">
                    Don't have an account? <a href="signup.html">Create a free account.</a> 
                    <br><br>Or<br><br>
                    <a href="../game_introduction.html" >Start a Free Game Trial</a>
                </div>

            </form>
        </div>

    </div>

    <?php if ($is_invalid) : ?>
        <em>Invalid login</em>
    <?php endif; ?>



</body>

</html>