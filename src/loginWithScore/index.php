<?php

session_start();

if (isset($_SESSION["user_id"])) {

    $mysqli = require __DIR__ . "/database.php";

    $sql = "SELECT * FROM users
            WHERE id = {$_SESSION["user_id"]}";

    $result = $mysqli->query($sql);

    $user = $result->fetch_assoc();
}

?>

<!DOCTYPE html>
<html>

<head>
    <title>Home</title>
    <meta charset="UTF-8">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../style.css">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@48,600,0,0" />
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-GLhlTQ8iRABdZLl6O3oVMWSktQOp6b7In1Zl3/Jr59b6EGGoI1aFkw7cmDA6j6gD" crossorigin="anonymous">
    <!-- <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.css"> -->

    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
</head>

<body>

    <div class="login-card-container">
        <div class="login-card">
            <div class="login-card-header">
                <h1>Home</h1>
            </div>
            <form class="login-card-form">
                <?php if (isset($user)) : ?>
                    <div class="form-item">
                        <p>Hello <?= htmlspecialchars($user["name"]) ?>!</p>
                    </div>

                    <div class="form-item">
                        <p>Your score: <span id="score">
                                <?= htmlspecialchars($user["score"]) ?>
                            </span></p>
                    </div>

                    <div class="form-item">
                        <p><span id="score">
                                Last Time You Got the Reward: <?= htmlspecialchars($user["gotReward"]) ?>
                                <?php
                                if (htmlspecialchars($user["gotReward"]) == date('Y-m-d')) echo "You have got your daily login reward!";
                                //else echo "You are now available to get your daily login reward!";
                                ?>
                            </span></p>
                    </div>

                    <?php if (htmlspecialchars($user["gotReward"]) != date('Y-m-d')) :?>

                    <div class="form-item">
                        <button onclick="getReward()">Get Daily Login Reward</button>
                    </div>

                    <?php endif; ?>

                    

                    <div class="form-item">
                        <button onclick="increaseScore()">+1</button>
                        <button onclick="clearScore()">Clear Your Scores</button>
                    </div>

                    

                    <div class="form-item">
                        <a id="game-trial" href="../achievement.php" role="button">Achievement Garden</a>
                    </div>

                    <div class="form-item">
                        <a id="game-trial" href="../game_introduction.html" role="button">View Your Games</a>
                    </div>

                    <div class="form-item">
                        <p><a href="logout.php">Log out</a></p>
                    </div>

                <?php else : ?>

                    <p><a href="login.php">Log in</a> or <a href="signup.html">sign up</a></p>

                <?php endif; ?>


            </form>
        </div>
    </div>

    <script>
        function increaseScore() {
            var userId = <?php echo json_encode($_SESSION["user_id"]); ?>;
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function() {
                if (xhr.readyState === XMLHttpRequest.DONE) document.getElementById("score").innerHTML = xhr.responseText;
            };
            xhr.open("GET", "updateScore/increaseScore.php?id=" + encodeURIComponent(userId), true);
            xhr.send();
        }

        function clearScore() {
            var userId = <?php echo json_encode($_SESSION["user_id"]); ?>;
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function() {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    document.getElementById("score").innerHTML = "0";
                    alert("Score has been cleared.");
                }
            };
            xhr.open("GET", "updateScore/clearScore.php?id=" + encodeURIComponent(userId), true);
            xhr.send();
        }

        function getReward() {
            var userId = <?php echo json_encode($_SESSION["user_id"]); ?>;
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function() {
                if (xhr.readyState === XMLHttpRequest.DONE) document.getElementById("score").innerHTML = xhr.responseText;
            };
            xhr.open("GET", "updateScore/loginReward.php?id=" + encodeURIComponent(userId), true);
            xhr.send();

            localStorage.setItem('lastCheckIn', today);
            alert('+3!');
        }

        function showCheckInInfo() {
            var lastCheckIn = localStorage.getItem('lastCheckIn');
            if (lastCheckIn) {
                document.getElementById('checkin-info').textContent = 'Last Time Check in is: ' + lastCheckIn;
            } else {
                document.getElementById('checkin-info').textContent = 'Have not check in yet';
            }
        }
    </script>
</body>

</html>